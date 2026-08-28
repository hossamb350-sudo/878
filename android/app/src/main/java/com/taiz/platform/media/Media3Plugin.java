package com.taiz.platform.media;

import android.content.ComponentName;
import android.net.Uri;
import android.util.Log;

import androidx.core.content.ContextCompat;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.Player;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;
import com.google.common.util.concurrent.ListenableFuture;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Media3")
public class Media3Plugin extends Plugin {
    private MediaController mediaController;
    private ListenableFuture<MediaController> controllerFuture;

    @Override
    public void load() {
        super.load();
        SessionToken sessionToken = new SessionToken(getContext(), new ComponentName(getContext(), PlaybackService.class));
        controllerFuture = new MediaController.Builder(getContext(), sessionToken).buildAsync();
        controllerFuture.addListener(() -> {
            try {
                mediaController = controllerFuture.get();
                mediaController.addListener(new Player.Listener() {
                    @Override
                    public void onIsPlayingChanged(boolean isPlaying) {
                        JSObject ret = new JSObject();
                        ret.put("isPlaying", isPlaying);
                        notifyListeners("onPlaybackStateChanged", ret);
                    }
                    
                    @Override
                    public void onPlaybackStateChanged(int playbackState) {
                        if (playbackState == Player.STATE_ENDED) {
                            JSObject ret = new JSObject();
                            ret.put("isPlaying", false);
                            ret.put("ended", true);
                            notifyListeners("onPlaybackStateChanged", ret);
                        }
                    }
                });
            } catch (Exception e) {
                Log.e("Media3Plugin", "Failed to connect to MediaSessionService", e);
            }
        }, ContextCompat.getMainExecutor(getContext()));
    }

    @PluginMethod
    public void play(PluginCall call) {
        if (mediaController == null) {
            call.reject("MediaController not initialized");
            return;
        }

        String url = call.getString("url");
        String title = call.getString("title", "إذاعة تعز");
        String artist = call.getString("artist", "منصة تعز الإعلامية");
        String artwork = call.getString("artwork", "");

        MediaMetadata metadata = new MediaMetadata.Builder()
                .setTitle(title)
                .setArtist(artist)
                .setArtworkUri(artwork.isEmpty() ? null : Uri.parse(artwork))
                .build();

        MediaItem mediaItem = new MediaItem.Builder()
                .setUri(url)
                .setMediaMetadata(metadata)
                .build();

        getActivity().runOnUiThread(() -> {
            mediaController.setMediaItem(mediaItem);
            mediaController.prepare();
            mediaController.play();
            call.resolve();
        });
    }

    @PluginMethod
    public void pause(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.pause();
                call.resolve();
            });
        } else {
            call.reject("Not initialized");
        }
    }
    
    @PluginMethod
    public void resume(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.play();
                call.resolve();
            });
        } else {
            call.reject("Not initialized");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.stop();
                mediaController.clearMediaItems();
                call.resolve();
            });
        } else {
            call.reject("Not initialized");
        }
    }
}
