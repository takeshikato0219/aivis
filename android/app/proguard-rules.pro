# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html
#
# Shrinking policy: do NOT remove or narrow broad -keep rules below to "save a
# few KB" without a failing test or a minimal repro. Many libraries (RN, ML Kit,
# Firebase, ExoPlayer, WebRTC, Vision Camera) rely on reflection; aggressive
# -keep removal causes release-only crashes. If you must tune rules: reproduce
# on a release build, add one targeted -keep, verify, then repeat.

# Add any project specific keep options here:
# React Native
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# WebRTC
-keep class org.webrtc.** { *; }
-dontwarn org.webrtc.**

# Vision Camera
-keep class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**

# MLKit
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# Media3 (react-native-video 6.x uses androidx.media3 instead of exoplayer2)
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# BLE
-keep class com.polidea.rxandroidble.** { *; }

# Gson / reflection
-keepattributes Signature
-keepattributes *Annotation*

# Kotlin
-dontwarn kotlin.**
-keep class kotlin.Metadata { *; }

# AndroidX
-dontwarn androidx.**

# LINE SDK
-keep class com.linecorp.linesdk.** { *; }
-dontwarn com.linecorp.linesdk.**

# Preserve crash stack traces (Firebase Crashlytics)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Firebase Cloud Messaging (FCM) - required for release build / DeployGate
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class io.invertase.firebase.** { *; }
-dontwarn io.invertase.firebase.**

# ShortcutBadger (app icon badge)
-keep class me.leolin.shortcutbadger.impl.** { <init>(...); }

# Remove debug logs only - does not affect app logic
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
}