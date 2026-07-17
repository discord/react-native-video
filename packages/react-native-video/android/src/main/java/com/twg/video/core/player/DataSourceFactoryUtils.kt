package com.twg.video.core.player

import android.content.Context
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.HttpDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.network.CookieJarContainer
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.OkHttpClientProvider
import com.margelo.nitro.video.HybridVideoPlayerSourceSpec
import okhttp3.JavaNetCookieJar

/**
 * Discord hooks for selecting an HTTP engine (OkHttp / Cronet) and optionally
 * injecting a shared default [DataSource.Factory] from the host app.
 *
 * The JS compat layer passes the engine via [DISCORD_HTTP_ENGINE_HEADER]; that
 * header is stripped before request headers are applied so it never hits the CDN.
 */
object DiscordDataSourceBridge {
  private const val TAG = "DiscordDataSourceBridge"

  /** Header mirrored from JS `DISCORD_HTTP_ENGINE_HEADER`. */
  const val HTTP_ENGINE_HEADER = "X-Discord-Http-Engine"

  @Volatile
  private var httpEngineFactoryResolver: ((String) -> DataSource.Factory?)? = null

  @Volatile
  private var defaultDataSourceFactory: DataSource.Factory? = null

  @JvmStatic
  fun setHttpEngineFactoryResolver(resolver: ((String) -> DataSource.Factory?)?) {
    httpEngineFactoryResolver = resolver
  }

  @JvmStatic
  fun setDefaultDataSourceFactory(factory: DataSource.Factory?) {
    defaultDataSourceFactory = factory
  }

  internal fun resolveHttpEngineFactory(engine: String?): DataSource.Factory? {
    if (engine.isNullOrBlank()) return null
    return httpEngineFactoryResolver?.invoke(engine)
  }

  internal fun defaultFactoryOrNull(): DataSource.Factory? = defaultDataSourceFactory

  internal fun stripEngineHeader(headers: Map<String, String>?): Pair<String?, Map<String, String>?> {
    if (headers.isNullOrEmpty()) return null to headers
    val engine = headers[HTTP_ENGINE_HEADER]
    if (engine == null) return null to headers
    val cleaned = headers.filterKeys { it != HTTP_ENGINE_HEADER }
    return engine to cleaned.ifEmpty { null }
  }

  internal fun logResolverMiss(engine: String) {
    Log.w(TAG, "No DataSource.Factory registered for httpEngine='$engine'; using default")
  }
}

fun buildBaseDataSourceFactory(context: Context, source: HybridVideoPlayerSourceSpec): DataSource.Factory {
  val (engine, headers) = DiscordDataSourceBridge.stripEngineHeader(source.config.headers)

  DiscordDataSourceBridge.resolveHttpEngineFactory(engine)?.let { return it }
  if (engine != null) {
    DiscordDataSourceBridge.logResolverMiss(engine)
  }

  DiscordDataSourceBridge.defaultFactoryOrNull()?.let { return it }

  return if (source.uri.startsWith("http")) {
    DefaultDataSource.Factory(context, buildHttpDataSourceFactory(context, headers))
  } else {
    DefaultDataSource.Factory(context)
  }
}

@OptIn(UnstableApi::class)
fun buildHttpDataSourceFactory(context: Context, headers: Map<String, String>?): HttpDataSource.Factory {
  val client = OkHttpClientProvider.getOkHttpClient()

  if (context is ReactContext) {
    val handler = ForwardingCookieHandler(context)
    (client.cookieJar as CookieJarContainer).setCookieJar(JavaNetCookieJar(handler))
  }

  val factory = OkHttpDataSource.Factory(client)

  if (headers != null) {
    factory.setDefaultRequestProperties(headers)
  }

  if (headers == null || !headers.containsKey("User-Agent")) {
    factory.setUserAgent(getUserAgent(context))
  }

  return factory
}

@OptIn(UnstableApi::class)
@Deprecated("Use buildHttpDataSourceFactory(context, headers) — kept for call-site compatibility")
fun buildHttpDataSourceFactory(context: Context, source: HybridVideoPlayerSourceSpec): OkHttpDataSource.Factory {
  val (_, headers) = DiscordDataSourceBridge.stripEngineHeader(source.config.headers)
  return buildHttpDataSourceFactory(context, headers) as OkHttpDataSource.Factory
}

@OptIn(UnstableApi::class)
fun getUserAgent(context: Context): String {
  return Util.getUserAgent(context, context.packageName)
}
