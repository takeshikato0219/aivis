# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

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

# Exoplayer (react-native-video)
-keep class com.google.android.exoplayer2.** { *; }
-dontwarn com.google.android.exoplayer2.**

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

# Databinding classes
-keep class **.BR { *; }

# Android databinding
-keep class androidx.databinding.** { *; }
-dontwarn androidx.databinding.**