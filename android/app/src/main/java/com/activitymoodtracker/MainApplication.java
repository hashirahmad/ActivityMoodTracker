package com.activitymoodtracker;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.github.yamill.orientation.OrientationPackage;
import com.masteratul.exceptionhandler.ReactNativeExceptionHandlerPackage;
import com.avishayil.rnrestart.ReactNativeRestartPackage;
import com.azendoo.reactnativesnackbar.SnackbarPackage;
import com.horcrux.svg.SvgPackage;
import com.rnfs.RNFSPackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;
import org.pgsqlite.SQLitePluginPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new SQLitePluginPackage(),
          new MainReactPackage(),
            new OrientationPackage(),
            new ReactNativeExceptionHandlerPackage(),
            new ReactNativeRestartPackage(),
            new SnackbarPackage(),
            new SvgPackage(),
            new RNFSPackage(),
            new ReactNativePushNotificationPackage(),
            new VectorIconsPackage(),
            new RNGestureHandlerPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
