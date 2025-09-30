# 🎥 LogiCam Control

A modern, intuitive Terminal User Interface (TUI) for controlling Logitech C920 webcam settings on Linux systems. Built with React and Ink for a smooth, responsive experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)

## ✨ Features

- **🎨 Modern UI**: Beautiful terminal interface built with React and Ink
- **📊 Live Monitoring**: Real-time device status and settings display
- **🎯 Organized Layout**: Device info on the left, all settings on the right
- **📈 Visual Feedback**: Color-coded progress bars and status indicators
- **⚡ Quick Actions**: One-key shortcuts for common tasks
- **🔧 Complete Control**: Adjust all camera parameters
  - Video format (resolution, pixel format, frame rate)
  - Picture quality (brightness, contrast, saturation, sharpness, gain)
  - Camera controls (auto exposure, focus, white balance)
  - Power line frequency filter
- **🎬 Optimal Presets**: Apply professional-quality settings with one command
- **🔄 Factory Reset**: Restore original webcam defaults
- **ℹ️ Detailed Info**: View comprehensive camera information

## 📋 Prerequisites

### Required
```bash
sudo apt install v4l-utils nodejs npm
```

### Optional (for Node.js 20+)
```bash
# If you don't have Node.js 20 or higher:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs
```

## 🚀 Installation

1. Clone or download this project
   ```bash
   git clone <repository-url>
   cd logicam-control
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## 💻 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Install Globally
```bash
npm install -g .
logicam
```

## ⌨️ Keyboard Shortcuts

### Navigation
- **↑ ↓** — Navigate between settings
- **← →** — Adjust values / Change options / Toggle settings
- **Enter** — Toggle boolean settings (ON/OFF)
- **PgUp / PgDn** — Adjust range values by ±10

### Quick Actions
- **O** — Apply optimal settings for best quality
- **R** — Reset all settings to factory defaults
- **I** — Show detailed camera information
- **H / ?** — Show help screen
- **Q / Ctrl+C** — Quit the application

## 🎯 Optimal Settings

The "Apply Optimal Settings" feature configures your C920 for professional quality:
- **1920x1080 @ 30fps MJPG** — High-quality video format
- **Auto Exposure** — Automatic lighting adjustment
- **Auto Focus** — Continuous focus for sharp video
- **Auto White Balance** — Natural color reproduction
- **60Hz Power Line Filter** — Reduces flicker (use 50Hz for EU/Asia)
- **Balanced Picture Settings** — Optimal brightness, contrast, saturation, and sharpness

## 🏗️ Technical Stack

- **Language**: TypeScript
- **Runtime**: Node.js (ESM modules)
- **UI Framework**: React + Ink (modern terminal UI)
- **Hardware Interface**: v4l2-ctl (Video4Linux2)
- **Supported Devices**: Logitech C920 and UVC-compatible webcams

## 🔧 Architecture

```
┌─────────────────────────────────────┐
│  LogiCam Control (React + Ink)     │
├─────────────────────────────────────┤
│  WebcamController (TypeScript)     │
├─────────────────────────────────────┤
│  v4l2-ctl (Video4Linux2)           │
├─────────────────────────────────────┤
│  Logitech C920 Webcam              │
└─────────────────────────────────────┘
```

## Virtual Camera

You can stream your Logitech C920 to a virtual camera device using v4l2loopback and ffmpeg:

### Prerequisites
```bash
sudo apt install v4l2loopback-dkms ffmpeg
sudo modprobe -r v4l2loopback
sudo modprobe v4l2loopback devices=1 video_nr=10 max_buffers=2 exclusive_caps=1 card_label="Virtual Webcam"
```

### Start Virtual Camera Streaming
```bash
ffmpeg -f v4l2 -input_format mjpeg -framerate 30 -video_size 1920x1080 -i /dev/video0 -pix_fmt yuyv422 -f v4l2 /dev/video10

# or with hardward acceleration
ffmpeg -f v4l2 -hwaccel vdpau -input_format mjpeg -framerate 60 -video_size 1920x1080 -i /dev/video0 -pix_fmt yuyv422 -f v4l2 /dev/video10
```

- `/dev/video0` is the source webcam (Logitech C920)
- `/dev/video10` is the output virtual camera device (created by v4l2loopback)
- Use `v4l2-ctl --list-devices` to find available video devices

### Managing Virtual Camera
- **Check if streaming**: `ps aux | grep ffmpeg`
- **Stop streaming**: Kill the ffmpeg process or use `Ctrl+C`
- **Find PID**: `pgrep -f "ffmpeg.*v4l2"`
- **Kill by PID**: `kill <PID>`

The virtual camera `/dev/video10` can then be used in video applications like OBS, Zoom, or other software that supports V4L2 devices.

## 🐛 Troubleshooting

### Webcam Not Found
Ensure your C920 is connected and recognized:
```bash
ls /dev/video*
v4l2-ctl --list-devices
```

### Permission Denied
Add your user to the `video` group:
```bash
sudo usermod -a -G video $USER
# Log out and back in for changes to take effect
```

### v4l2-ctl Not Found
Install Video4Linux utilities:
```bash
sudo apt install v4l-utils
```

### Settings Locked / Cannot Change Format
If settings show as locked (🔒), the camera is being used by another application:
- Close any video conferencing apps (Zoom, Teams, etc.)
- Close browsers with active camera access
- Check for background processes: `lsof /dev/video0`

### Module/Transform Errors
If you encounter ESM-related errors:
- Ensure you're using Node.js 20 or higher: `node --version`
- Try removing `node_modules` and reinstalling:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Virtual Camera Issues
Ensure v4l2loopback module is loaded:
```bash
lsmod | grep v4l2loopback
# If not loaded, see Virtual Camera section
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

MIT License — See LICENSE file for details

## 🙏 Acknowledgments

- Built with [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- Uses [Video4Linux2](https://www.kernel.org/doc/html/latest/userspace-api/media/v4l/v4l2.html) for camera control
- Inspired by the need for better Linux webcam control tools
