package com.taiz.platform;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.taiz.platform.media.Media3Plugin;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(Media3Plugin.class);
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseOptions options = new FirebaseOptions.Builder()
                    .setApiKey("AIzaSyBtDGIkBdjQp46d51ZRkQN4ZxlCD6_is3M")
                    .setApplicationId("1:565624301516:android:3dd0c9be94870cc238df69")
                    .setProjectId("gen-lang-client-0926657815")
                    .setGcmSenderId("565624301516")
                    .setStorageBucket("gen-lang-client-0926657815.firebasestorage.app")
                    .build();
                FirebaseApp.initializeApp(this, options);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        super.onCreate(savedInstanceState);
    }
}

