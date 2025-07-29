import express from 'express';
import pkg from 'agora-access-token';
import { authenticateToken } from '../middleware/auth.js';
import { checkRoomAccess } from '../middleware/roomAuth.js';
const { RtcTokenBuilder, RtcRole } = pkg;

const router = express.Router();

// Generate Agora token for voice/video calls
router.post('/token/:roomId', authenticateToken, checkRoomAccess, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { channelName, uid } = req.body;

    if (!channelName || !uid) {
      return res.status(400).json({ error: 'Channel name and UID are required' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({ error: 'Agora credentials not configured' });
    }

    // Token expires in 24 hours
    const expirationTimeInSeconds = 3600 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token with publisher role
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({
      token,
      appId,
      channelName,
      uid,
      expiresAt: privilegeExpiredTs
    });
  } catch (error) {
    console.error('Generate Agora token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

export default router;