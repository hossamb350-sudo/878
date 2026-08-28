package com.taiz.platform.media;

import android.content.Intent;
import androidx.annotation.Nullable;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

public class PlaybackService extends MediaSessionService {
    private MediaSession mediaSession;
    private ExoPlayer player;

    @Override
    public void onCreate() {
        super.onCreate();
        player = new ExoPlayer.Builder(this).build();
        
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
            .setUsage(C.USAGE_MEDIA)
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .build();
        player.setAudioAttributes(audioAttributes, true);

        mediaSession = new MediaSession.Builder(this, player).build();
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.getPlayer().release();
            mediaSession.release();
            mediaSession = null;
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }
}
