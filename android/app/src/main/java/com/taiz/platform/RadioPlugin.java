package com.taiz.platform;

import android.Manifest;
import android.content.ComponentName;
import android.net.Uri;
import android.os.Build;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.Player;
import androidx.media3.common.PlaybackException;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.common.util.concurrent.MoreExecutors;
import java.util.concurrent.ExecutionException;
import android.util.Log;

@CapacitorPlugin(
    name = "RadioPlayer",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class RadioPlugin extends Plugin {

    private MediaController controller;
    private ListenableFuture<MediaController> controllerFuture;
    private String currentUrl = "";
    private PluginCall pendingPlayCall = null;
    private String pendingUrl = null;
    private String pendingName = null;
    private String pendingArtwork = null;

    @Override
    public void load() {
        Log.d("RadioPlugin", "Loading Plugin");
        SessionToken sessionToken = new SessionToken(getContext(),
                new ComponentName(getContext(), RadioPlaybackService.class));
        
        controllerFuture = new MediaController.Builder(getContext(), sessionToken).buildAsync();
        controllerFuture.addListener(() -> {
            try {
                controller = controllerFuture.get();
                Log.d("RadioPlugin", "Controller connected");
                
                controller.addListener(new Player.Listener() {
                    @Override
                    public void onPlaybackStateChanged(int playbackState) {
                        Log.d("RadioPlugin", "State changed: " + playbackState);
                        if (playbackState == Player.STATE_BUFFERING) {
                            notifyListeners("buffering", new JSObject());
                        } else if (playbackState == Player.STATE_ENDED) {
                            notifyListeners("stopped", new JSObject());
                        }
                    }

                    @Override
                    public void onIsPlayingChanged(boolean isPlaying) {
                        Log.d("RadioPlugin", "isPlaying changed: " + isPlaying);
                        if (isPlaying) {
                            notifyListeners("playing", new JSObject());
                        } else {
                            if (controller.getPlaybackState() != Player.STATE_BUFFERING) {
                                notifyListeners("paused", new JSObject());
                            }
                        }
                    }
                    
                    @Override
                    public void onPlayerError(PlaybackException error) {
                        Log.e("RadioPlugin", "Player error: " + error.getMessage());
                        JSObject ret = new JSObject();
                        ret.put("error", error.getMessage());
                        notifyListeners("error", ret);
                    }
                });
            } catch (ExecutionException | InterruptedException e) {
                e.printStackTrace();
            }
        }, MoreExecutors.directExecutor());
    }

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        String stationName = call.getString("stationName", "Radio");
        String artwork = call.getString("artwork", "");
        
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }

        // Request notification permission on Android 13+ if not granted yet
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (getPermissionState("notifications") != com.getcapacitor.PermissionState.GRANTED) {
                pendingPlayCall = call;
                pendingUrl = url;
                pendingName = stationName;
                pendingArtwork = artwork;
                requestPermissionForAlias("notifications", call, "notificationsPermsCallback");
                return;
            }
        }
        
        executePlay(call, url, stationName, artwork);
    }

    @PermissionCallback
    private void notificationsPermsCallback(PluginCall call) {
        // Even if permission is denied, we still attempt to play. 
        // The service will just run without a visible notification.
        if (pendingPlayCall != null && pendingUrl != null) {
            executePlay(pendingPlayCall, pendingUrl, pendingName, pendingArtwork);
            pendingPlayCall = null;
        } else {
            call.resolve();
        }
    }

    private void executePlay(PluginCall call, String url, String stationName, String artwork) {
        if (controller != null) {
            if (!url.equals(currentUrl)) {
                currentUrl = url;
                
                MediaMetadata.Builder metadataBuilder = new MediaMetadata.Builder()
                        .setTitle(stationName)
                        .setArtist("Live Stream");
                        
                if (artwork != null && !artwork.isEmpty()) {
                    metadataBuilder.setArtworkUri(Uri.parse(artwork));
                }

                MediaItem mediaItem = new MediaItem.Builder()
                        .setUri(Uri.parse(url))
                        .setMediaMetadata(metadataBuilder.build())
                        .build();

                controller.setMediaItem(mediaItem);
                controller.prepare();
            }
            controller.play();
            call.resolve();
        } else {
            call.reject("Controller not ready");
        }
    }

    @PluginMethod
    public void pause(PluginCall call) {
        if (controller != null) {
            controller.pause();
            call.resolve();
        } else {
            call.reject("Controller not ready");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (controller != null) {
            controller.stop();
            controller.clearMediaItems();
            currentUrl = "";
            call.resolve();
            notifyListeners("stopped", new JSObject());
        } else {
            call.reject("Controller not ready");
        }
    }
}
