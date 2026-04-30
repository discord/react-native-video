package com.brentvatne.exoplayer;

import android.util.Log;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.network.CookieJarContainer;
import com.facebook.react.modules.network.ForwardingCookieHandler;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.google.android.exoplayer2.ext.okhttp.OkHttpDataSourceFactory;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory;
import com.google.android.exoplayer2.upstream.HttpDataSource;
import com.google.android.exoplayer2.util.Util;

import okhttp3.JavaNetCookieJar;
import okhttp3.OkHttpClient;
import java.util.Map;
import java.util.function.Function;

public class DataSourceUtil {

    private static final String TAG = "DataSourceUtil";

    private DataSourceUtil() {
    }

    private static DataSource.Factory rawDataSourceFactory = null;
    private static DataSource.Factory defaultDataSourceFactory = null;
    private static HttpDataSource.Factory defaultHttpDataSourceFactory = null;
    private static Function<String, DataSource.Factory> httpEngineFactoryResolver = null;
    private static String userAgent = null;

    public static void setUserAgent(String userAgent) {
        DataSourceUtil.userAgent = userAgent;
    }

    public static String getUserAgent(ReactContext context) {
        if (userAgent == null) {
            userAgent = Util.getUserAgent(context, "ReactNativeVideo");
        }
        return userAgent;
    }

    public static DataSource.Factory getRawDataSourceFactory(ReactContext context) {
        if (rawDataSourceFactory == null) {
            rawDataSourceFactory = buildRawDataSourceFactory(context);
        }
        return rawDataSourceFactory;
    }

    public static void setRawDataSourceFactory(DataSource.Factory factory) {
        DataSourceUtil.rawDataSourceFactory = factory;
    }


    public static void setHttpEngineFactoryResolver(Function<String, DataSource.Factory> resolver) {
        httpEngineFactoryResolver = resolver;
    }

    public static DataSource.Factory getDataSourceFactory(ReactContext context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders, String httpEngine) {
        if (httpEngine != null && httpEngineFactoryResolver != null) {
            DataSource.Factory factory = httpEngineFactoryResolver.apply(httpEngine);
            if (factory != null) {
                return factory;
            }
        }
        return getDefaultDataSourceFactory(context, bandwidthMeter, requestHeaders);
    }

    /**
     * Returns an HttpDataSource.Factory selected by the registered httpEngine resolver, or the
     * default factory if no engine is selected, no resolver is registered, the resolver returns
     * null, or the resolver returns a DataSource.Factory that does not implement
     * HttpDataSource.Factory.
     *
     * The resolver registered via setHttpEngineFactoryResolver returns a generic DataSource.Factory.
     * Most HTTP-backed engines (OkHttpDataSourceFactory, CronetDataSource.Factory) also implement
     * HttpDataSource.Factory, so the typical case works. The instanceof guard protects against
     * resolvers that return a non-HTTP-typed factory and logs a warning so host apps can detect
     * the mismatch.
     */
    public static HttpDataSource.Factory getHttpDataSourceFactory(ReactContext context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders, String httpEngine) {
        if (httpEngine != null && httpEngineFactoryResolver != null) {
            DataSource.Factory factory = httpEngineFactoryResolver.apply(httpEngine);
            if (factory instanceof HttpDataSource.Factory) {
                return (HttpDataSource.Factory) factory;
            }
            if (factory != null) {
                Log.w(TAG, "httpEngineFactoryResolver returned a DataSource.Factory that does not implement HttpDataSource.Factory for engine '" + httpEngine + "'; falling back to default HttpDataSource.Factory");
            }
        }
        return getDefaultHttpDataSourceFactory(context, bandwidthMeter, requestHeaders);
    }

    public static DataSource.Factory getDefaultDataSourceFactory(ReactContext context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        if (defaultDataSourceFactory == null || (requestHeaders != null && !requestHeaders.isEmpty())) {
            defaultDataSourceFactory = buildDataSourceFactory(context, bandwidthMeter, requestHeaders);
        }
        return defaultDataSourceFactory;
    }

    public static void setDefaultDataSourceFactory(DataSource.Factory factory) {
        DataSourceUtil.defaultDataSourceFactory = factory;
    }

    public static HttpDataSource.Factory getDefaultHttpDataSourceFactory(ReactContext context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        if (defaultHttpDataSourceFactory == null || (requestHeaders != null && !requestHeaders.isEmpty())) {
            defaultHttpDataSourceFactory = buildHttpDataSourceFactory(context, bandwidthMeter, requestHeaders);
        }
        return defaultHttpDataSourceFactory;
    }

    public static void setDefaultHttpDataSourceFactory(HttpDataSource.Factory factory) {
        DataSourceUtil.defaultHttpDataSourceFactory = factory;
    }

    private static DataSource.Factory buildRawDataSourceFactory(ReactContext context) {
        return new RawResourceDataSourceFactory(context.getApplicationContext());
    }

    private static DataSource.Factory buildDataSourceFactory(ReactContext context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        return new DefaultDataSourceFactory(context, bandwidthMeter,
                buildHttpDataSourceFactory(context, bandwidthMeter, requestHeaders));
    }

    private static HttpDataSource.Factory buildHttpDataSourceFactory(ReactContext context, DefaultBandwidthMeter bandwidthMeter, Map<String, String> requestHeaders) {
        OkHttpClient client = OkHttpClientProvider.getOkHttpClient();
        CookieJarContainer container = (CookieJarContainer) client.cookieJar();
        ForwardingCookieHandler handler = new ForwardingCookieHandler(context);
        container.setCookieJar(new JavaNetCookieJar(handler));
        OkHttpDataSourceFactory okHttpDataSourceFactory = new OkHttpDataSourceFactory(client, getUserAgent(context), bandwidthMeter);

        if (requestHeaders != null)
            okHttpDataSourceFactory.setDefaultRequestProperties(requestHeaders);

        return okHttpDataSourceFactory;
    }
}
