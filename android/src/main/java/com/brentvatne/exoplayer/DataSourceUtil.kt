package com.brentvatne.exoplayer

import android.net.Uri
import android.util.Log
import androidx.media3.common.util.Util
import androidx.media3.datasource.AssetDataSource
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.HttpDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.upstream.DefaultBandwidthMeter
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.network.CookieJarContainer
import com.facebook.react.modules.network.ForwardingCookieHandler
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.Call
import okhttp3.JavaNetCookieJar

object DataSourceUtil {
    private const val TAG = "DataSourceUtil"
    private var defaultDataSourceFactory: DataSource.Factory? = null
    private var defaultHttpDataSourceFactory: HttpDataSource.Factory? = null
    private var userAgent: String? = null

    // Discord: resolver registered by the host app to select an HTTP data source engine
    // (e.g. OkHttp, Cronet) by name.
    private var httpEngineFactoryResolver: ((String) -> DataSource.Factory?)? = null

    private fun getUserAgent(context: ReactContext): String {
        if (userAgent == null) {
            userAgent = Util.getUserAgent(context, context.packageName)
        }
        return userAgent as String
    }

    @JvmStatic
    fun setHttpEngineFactoryResolver(resolver: ((String) -> DataSource.Factory?)?) {
        httpEngineFactoryResolver = resolver
    }

    @JvmStatic
    fun getDataSourceFactory(
        context: ReactContext,
        bandwidthMeter: DefaultBandwidthMeter?,
        requestHeaders: Map<String, String>?,
        httpEngine: String?
    ): DataSource.Factory {
        if (httpEngine != null) {
            val factory = httpEngineFactoryResolver?.invoke(httpEngine)
            if (factory != null) {
                return factory
            }
        }
        return getDefaultDataSourceFactory(context, bandwidthMeter, requestHeaders)
    }

    @JvmStatic
    fun getHttpDataSourceFactory(
        context: ReactContext,
        bandwidthMeter: DefaultBandwidthMeter?,
        requestHeaders: Map<String, String>?,
        httpEngine: String?
    ): HttpDataSource.Factory {
        if (httpEngine != null) {
            val factory = httpEngineFactoryResolver?.invoke(httpEngine)
            if (factory is HttpDataSource.Factory) {
                return factory
            }
            if (factory != null) {
                Log.w(
                    TAG,
                    "httpEngineFactoryResolver returned a DataSource.Factory that does not implement " +
                        "HttpDataSource.Factory for engine '$httpEngine'; falling back to default HttpDataSource.Factory"
                )
            }
        }
        return getDefaultHttpDataSourceFactory(context, bandwidthMeter, requestHeaders)
    }

    @JvmStatic
    fun getDefaultDataSourceFactory(context: ReactContext, bandwidthMeter: DefaultBandwidthMeter?, requestHeaders: Map<String, String>?): DataSource.Factory {
        if (defaultDataSourceFactory == null || !requestHeaders.isNullOrEmpty()) {
            defaultDataSourceFactory = buildDataSourceFactory(context, bandwidthMeter, requestHeaders)
        }
        return defaultDataSourceFactory as DataSource.Factory
    }

    // Discord: host apps register a shared CacheDataSource.Factory so RNV and the native
    // portal player reuse the same SimpleCache instance.
    @JvmStatic
    fun setDefaultDataSourceFactory(factory: DataSource.Factory?) {
        defaultDataSourceFactory = factory
    }

    @JvmStatic
    fun getDefaultHttpDataSourceFactory(
        context: ReactContext,
        bandwidthMeter: DefaultBandwidthMeter?,
        requestHeaders: Map<String, String>?
    ): HttpDataSource.Factory {
        if (defaultHttpDataSourceFactory == null || !requestHeaders.isNullOrEmpty()) {
            defaultHttpDataSourceFactory = buildHttpDataSourceFactory(context, bandwidthMeter, requestHeaders)
        }
        return defaultHttpDataSourceFactory as HttpDataSource.Factory
    }

    @JvmStatic
    fun setDefaultHttpDataSourceFactory(factory: HttpDataSource.Factory?) {
        defaultHttpDataSourceFactory = factory
    }

    private fun buildDataSourceFactory(
        context: ReactContext,
        bandwidthMeter: DefaultBandwidthMeter?,
        requestHeaders: Map<String, String>?
    ): DataSource.Factory = DefaultDataSource.Factory(context, buildHttpDataSourceFactory(context, bandwidthMeter, requestHeaders))

    private fun buildHttpDataSourceFactory(
        context: ReactContext,
        bandwidthMeter: DefaultBandwidthMeter?,
        requestHeaders: Map<String, String>?
    ): HttpDataSource.Factory {
        val client = OkHttpClientProvider.getOkHttpClient()
        val container = client.cookieJar as CookieJarContainer
        val handler = ForwardingCookieHandler(context)
        container.setCookieJar(JavaNetCookieJar(handler))
        val okHttpDataSourceFactory = OkHttpDataSource.Factory(client as Call.Factory)
            .setTransferListener(bandwidthMeter)

        if (requestHeaders != null) {
            okHttpDataSourceFactory.setDefaultRequestProperties(requestHeaders)
            if (!requestHeaders.containsKey("User-Agent")) {
                okHttpDataSourceFactory.setUserAgent(getUserAgent(context))
            }
        } else {
            okHttpDataSourceFactory.setUserAgent(getUserAgent(context))
        }

        return okHttpDataSourceFactory
    }

    @JvmStatic
    fun buildAssetDataSourceFactory(context: ReactContext?, srcUri: Uri?): DataSource.Factory {
        val dataSpec = DataSpec(srcUri!!)
        val rawResourceDataSource = AssetDataSource(context!!)
        rawResourceDataSource.open(dataSpec)
        return DataSource.Factory { rawResourceDataSource }
    }
}
