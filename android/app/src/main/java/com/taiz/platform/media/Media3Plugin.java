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
    private volatile String currentMediaType = "";
    private volatile String currentUrl = "";

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
                    public void onPlayWhenReadyChanged(boolean playWhenReady, int reason) {
                        JSObject ret = new JSObject();
                        ret.put("isPlaying", playWhenReady);
                        ret.put("mediaType", currentMediaType);
                        ret.put("url", currentUrl);
                        notifyListeners("onPlaybackStateChanged", ret);
                    }
                    
                    @Override
                    public void onPlaybackStateChanged(int playbackState) {
                        if (playbackState == Player.STATE_ENDED) {
                            JSObject ret = new JSObject();
                            ret.put("isPlaying", false);
                            ret.put("ended", true);
                            ret.put("mediaType", currentMediaType);
                            ret.put("url", currentUrl);
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
        String url = call.getString("url");
        String title = call.getString("title", "إذاعة تعز");
        String artist = call.getString("artist", "منصة تعز الإعلامية");
        String artwork = call.getString("artwork", "");
        String mediaType = call.getString("mediaType", "radio");

        this.currentMediaType = mediaType != null ? mediaType : "radio";
        this.currentUrl = url != null ? url : "";

        if (mediaController == null) {
            if (controllerFuture != null) {
                controllerFuture.addListener(() -> {
                    try {
                        mediaController = controllerFuture.get();
                        doPlay(url, title, artist, artwork, call);
                    } catch (Exception e) {
                        call.reject("MediaController initialization error: " + e.getMessage());
                    }
                }, ContextCompat.getMainExecutor(getContext()));
                return;
            }
            call.reject("MediaController not initialized");
            return;
        }

        doPlay(url, title, artist, artwork, call);
    }

    private void doPlay(String url, String title, String artist, String artwork, PluginCall call) {
        MediaMetadata metadata = new MediaMetadata.Builder()
                .setTitle(title)
                .setArtist(artist)
                .setArtworkUri((artwork != null && !artwork.isEmpty()) ? Uri.parse(artwork) : null)
                .build();

        MediaItem mediaItem = new MediaItem.Builder()
                .setUri(url)
                .setMediaMetadata(metadata)
                .build();

        getActivity().runOnUiThread(() -> {
            try {
                mediaController.setMediaItem(mediaItem);
                mediaController.prepare();
                mediaController.play();
                call.resolve();
            } catch (Exception e) {
                call.reject("Playback error: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void pause(PluginCall call) {
        String mediaType = call.getString("mediaType", null);
        if (mediaType != null && !mediaType.isEmpty() && !mediaType.equals(currentMediaType)) {
            call.resolve();
            return;
        }

        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                try {
                    mediaController.pause();
                    call.resolve();
                } catch (Exception e) {
                    call.reject("Pause error: " + e.getMessage());
                }
            });
        } else {
            call.resolve();
        }
    }
    
    @PluginMethod
    public void resume(PluginCall call) {
        String mediaType = call.getString("mediaType", null);
        if (mediaType != null && !mediaType.isEmpty() && !mediaType.equals(currentMediaType)) {
            call.resolve();
            return;
        }

        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                try {
                    mediaController.play();
                    call.resolve();
                } catch (Exception e) {
                    call.reject("Resume error: " + e.getMessage());
                }
            });
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        String mediaType = call.getString("mediaType", null);
        if (mediaType != null && !mediaType.isEmpty() && !mediaType.equals(currentMediaType)) {
            call.resolve();
            return;
        }

        this.currentMediaType = "";
        this.currentUrl = "";

        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                try {
                    mediaController.stop();
                    mediaController.clearMediaItems();
                    call.resolve();
                } catch (Exception e) {
                    call.reject("Stop error: " + e.getMessage());
                }
            });
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void getPlaybackState(PluginCall call) {
        JSObject ret = new JSObject();
        if (mediaController != null) {
            ret.put("isPlaying", mediaController.getPlayWhenReady());
            ret.put("mediaType", currentMediaType);
            ret.put("url", currentUrl);
        } else {
            ret.put("isPlaying", false);
            ret.put("mediaType", "");
            ret.put("url", "");
        }
        call.resolve(ret);
    }
}

