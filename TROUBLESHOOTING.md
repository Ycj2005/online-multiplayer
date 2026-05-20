# 🔧 Troubleshooting Guide - ChorusHub

## Common Issues & Solutions

### Connection Issues

#### "ERR_CONNECTION_REFUSED"
**Problem**: Frontend can't connect to backend

**Solution**:
1. Check backend is running:
   ```bash
   cd backend
   npm run dev
   ```
2. Verify port 3000 is free:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   # Mac/Linux
   lsof -i :3000
   ```
3. Update frontend config if using different port:
   ```javascript
   // frontend/js/config.js
   SOCKET_URL: "http://localhost:YOUR_PORT"
   ```

#### "Socket connection timeout"
**Problem**: Takes too long to connect

**Solution**:
- Restart backend server
- Check network connection
- Verify firewall isn't blocking port 3000
- Clear browser cache (Ctrl+Shift+Del)

### Camera/Microphone Issues

#### "getUserMedia is not defined"
**Problem**: Browser doesn't support WebRTC

**Solution**:
- Use modern browser (Chrome, Firefox, Safari, Edge)
- Update browser to latest version
- Check if WebRTC is enabled:
  - Chrome: Settings > Privacy > Camera/Microphone
  - Firefox: about:preferences > Privacy

#### "Permission denied accessing camera"
**Problem**: Browser permissions blocked

**Solution**:
1. Check browser permissions:
   - Chrome: Click camera icon → Allow
   - Firefox: Allow when prompted
   - Safari: System Preferences > Security > Camera
2. Clear site permissions:
   ```
   Chrome: Settings > Privacy > Site Settings > Camera
   Reset all sites
   ```
3. Restart browser and try again

#### "NotAllowedError: Permission dismissed"
**Problem**: User cancelled permissions

**Solution**:
1. Reload page
2. Click "Allow" on permission prompt
3. If doesn't appear, clear site permissions and retry

#### "NotFoundError: No connected input devices"
**Problem**: No camera/microphone detected

**Solution**:
- Check if camera connected and working:
  ```
  Windows: Settings > Devices > Camera
  Mac: System Preferences > Security > Camera
  ```
- Try different USB camera
- Reinstall audio drivers
- Test with another app first

#### "Camera works but no video in remote"
**Problem**: Local video works, but peer can't see it

**Solution**:
1. Verify both users in same room
2. Check ICE candidates exchanged:
   - Open console (F12)
   - Look for "ICE Candidate" messages
3. Check firewall allows P2P:
   - Disable firewall temporarily to test
   - Enable specific ports if needed
4. Try on same local network first

### Video/Audio Problems

#### "Video is choppy/stuttering"
**Problem**: Video playback is jerky

**Solution**:
1. Lower video resolution in config:
   ```javascript
   // frontend/js/config.js
   video: {
     width: { ideal: 640 },   // Lower from 1280
     height: { ideal: 480 },  // Lower from 720
   }
   ```
2. Reduce other network usage:
   - Close downloads
   - Close video streaming
   - Stop backups
3. Switch to wired ethernet
4. Move closer to WiFi router
5. Restart backend and frontend

#### "Audio is echoing"
**Problem**: Hearing yourself or audio loops

**Solution**:
1. Use headphones instead of speakers
2. Mute yourself (🎤 button)
3. Move mic away from speakers
4. Restart audio by toggling mute
5. Check echo cancellation enabled:
   ```javascript
   // Should already be in config.js
   audio: {
     echoCancellation: true,
     noiseSuppression: true,
   }
   ```

#### "No sound from other user"
**Problem**: Can't hear the other person

**Solution**:
1. Check volume isn't muted
2. Verify other user's 🎤 is not off
3. Check browser audio is enabled:
   - Check system volume
   - Check app volume (Mac: System Preferences)
4. Toggle audio off and on:
   ```
   Click 🎤 button twice
   ```
5. Restart call

#### "Microphone too quiet"
**Problem**: Other users can't hear you well

**Solution**:
1. Move closer to microphone
2. Check microphone volume:
   ```
   Windows: Settings > Sound > Input Volume
   Mac: System Preferences > Sound > Input
   ```
3. Adjust in OS settings
4. Try different microphone
5. Test recording in browser DevTools

### Chat Issues

#### "Messages not sending"
**Problem**: When you send, nothing appears

**Solution**:
1. Check socket connection:
   - Look at console for "✓ Connected"
   - If not, fix connection first
2. Verify you're in correct view:
   - For global chat: In Lobby view
   - For room chat: In Room view
3. Reload page to reset
4. Check console for errors (F12)

#### "Messages from others not appearing"
**Problem**: Can see your messages, but not others'

**Solution**:
1. Check other user is in same view:
   - For global: Both in Lobby
   - For room: Both in same room
2. Verify socket IDs are different:
   - Check console shows different socket IDs
3. Restart page and try again
4. Check backend is still running

#### "Typing indicator always shows"
**Problem**: Shows someone typing even though they aren't

**Solution**:
1. Reload page
2. Check other user's frontend
3. Restart backend if persistent
4. It's usually a harmless UI glitch

### Room Issues

#### "Can't create room - 'Room already exists'"
**Problem**: Room ID is taken

**Solution**:
- Use different room ID
- Room names are unique across server
- Try: `room-<random-numbers>`
- Example: `room-12345`

#### "Wrong password error"
**Problem**: Entered password not matching

**Solution**:
1. Check password is correct (case-sensitive)
2. Ask room creator for password
3. Create new room if forgotten password
4. Note: Passwords are not recoverable

#### "Room full error"
**Problem**: Room reached max users

**Solution**:
1. Create different room
2. Wait for someone to leave
3. Join different room with fewer users
4. Host can modify max users in future update

#### "Room deleted when I left"
**Problem**: Room gone after last person leaves

**Solution**:
- This is by design - empty rooms auto-delete
- Create new room if needed
- Someone must stay in room to keep it alive

### UI Issues

#### "Page looks broken"
**Problem**: Layout is messed up or missing styles

**Solution**:
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+F5)
3. Check CSS file loaded:
   - F12 > Network tab
   - Look for css/style.css
   - Should show 200 OK
4. Check console for JS errors
5. Try different browser

#### "Buttons don't work"
**Problem**: Clicking buttons does nothing

**Solution**:
1. Check console (F12) for errors
2. Verify socket connected
3. Try page refresh
4. Check you're in correct view for action
5. Restart backend

#### "Notification appears and disappears too fast"
**Problem**: Can't read notification message

**Solution**:
- This is normal, notification shows for 4 seconds
- Check console (F12) for full message
- Look for similar event in console

#### "Can't see other users' videos"
**Problem**: Video containers appear empty

**Solution**:
1. Check both users in same room
2. Verify cameras enabled (not showing "disabled")
3. Check browser console for errors
4. Test camera works first:
   - Open another video app
   - Verify camera works there
5. Reload both pages

### Performance Issues

#### "App is slow/laggy"
**Problem**: Everything takes too long

**Solution**:
1. Reduce number of open connections
2. Close other browser tabs
3. Disable extensions
4. Lower video quality in config
5. Restart browser
6. Check CPU usage:
   ```
   Windows: Task Manager > Performance
   Mac: Activity Monitor
   ```

#### "High CPU usage"
**Problem**: Fans running loud, battery draining

**Solution**:
1. Disable video (📹 button)
2. Lower video resolution
3. Close other apps
4. Update graphics drivers
5. Check for memory leaks:
   - Open DevTools Memory tab
   - Take heap snapshot
   - Leave running for 5 mins
   - Compare snapshots

#### "High network usage"
**Problem**: Internet is slow, bandwidth high

**Solution**:
1. Disable video
2. Lower video quality:
   ```javascript
   // frontend/js/config.js
   width: { ideal: 320 },
   height: { ideal: 240 },
   ```
3. Check for other downloads
4. Use wired ethernet
5. Reduce number of simultaneous calls

### Backend Issues

#### "ERR_MODULE_NOT_FOUND"
**Problem**: Backend can't start, missing modules

**Solution**:
```bash
cd backend
npm install
npm run dev
```

#### "Port already in use"
**Problem**: Port 3000 already running something

**Solution**:
```bash
# Find what's using port 3000
# Windows:
netstat -ano | findstr :3000
# Kill process
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>

# Or use different port in server.js
```

#### "Cannot find module"
**Problem**: Import/require error

**Solution**:
```bash
# Make sure in backend folder
cd backend
# Reinstall dependencies
rm node_modules
npm install
```

#### "Backend crashes randomly"
**Problem**: Server stops unexpectedly

**Solution**:
1. Check console for error messages
2. Look at logs for crash reason
3. Verify all handler files exist
4. Check syntax in handlers
5. Restart with:
   ```bash
   npm run dev
   ```

### Testing Issues

#### "Works locally but not on network"
**Problem**: Works on same computer but not across network

**Solution**:
1. Update backend to listen on all interfaces:
   ```javascript
   // server.js
   server.listen(3000, "0.0.0.0", () => {...})
   ```
2. Update frontend Socket URL:
   ```javascript
   // config.js
   SOCKET_URL: "http://<YOUR_IP>:3000"
   ```
3. Find your IP:
   ```
   Windows: ipconfig | findstr IPv4
   Mac/Linux: ifconfig | grep inet
   ```
4. Allow firewall:
   - Windows Firewall > Allow app > Node.js
   - Mac: System Preferences > Security

#### "Works on one browser but not another"
**Problem**: Works in Chrome but not Firefox

**Solution**:
1. Update all browsers to latest version
2. Check WebRTC support:
   - https://webrtc.org/infrastructure/testing/
3. Check browser privacy settings
4. Try incognito/private mode
5. Clear all cache and cookies

### Debug Mode

**Enable verbose logging**:
```javascript
// frontend/js/socketManager.js
// Uncomment console.log statements

// backend/src/server.js
// Already has console.log for all events
```

**Check Socket.IO debug**:
```javascript
// frontend/js/config.js
Add to Socket connection:
const socket = io(URL, {
  transports: ['websocket', 'polling'],
});
socket.on('connect', () => console.log('Connected!'));
```

**Monitor network**:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by WebSocket
4. Watch messages flow

**Memory profiling**:
1. DevTools > Memory
2. Take heap snapshot
3. Note size
4. Use app for 5 minutes
5. Take another snapshot
6. Compare - should be similar

## Getting Help

1. **Check Logs**:
   - Browser console: F12
   - Backend console: npm run dev output

2. **Isolate Problem**:
   - Test with just 2 browsers
   - Test on localhost first
   - Test each feature separately

3. **Use Browser DevTools**:
   - F12 opens DevTools
   - Console tab for errors
   - Network tab for connections
   - Application tab for storage

4. **Try Basic Fixes**:
   1. Refresh page
   2. Restart browser
   3. Restart backend
   4. Clear cache
   5. Restart computer (last resort)

## Performance Checklist

- [ ] Backend running on port 3000
- [ ] Frontend socket URL points to backend
- [ ] Firewall allows connections
- [ ] Camera/microphone working
- [ ] WebRTC supported in browser
- [ ] Network connection stable
- [ ] CPU not maxed out
- [ ] No errors in console
- [ ] Using headphones (recommended)
- [ ] Good lighting for video

## Quick Reset

If everything is broken:

```bash
# Terminal 1: Stop backend (Ctrl+C)
cd backend
npm run dev

# Browser: 
# Hard refresh: Ctrl+F5
# Clear cache: Ctrl+Shift+Del
# Close all tabs
# Open new private/incognito window
# Go to frontend/index.html
```

---

**Still having issues?**
1. Check all solutions above
2. Check console (F12) for exact error message
3. Try fresh browser window
4. Restart computer
5. Review README.md for setup

**Good luck! 🚀**
