import React, { useState, useCallback } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import { WebcamController, WebcamSettings, VideoFormat } from './webcam.js';

interface SettingItem {
	key: string;
	label: string;
	type: 'range' | 'toggle' | 'select';
	value: number | boolean | string;
	options?: string[];
	min?: number;
	max?: number;
	step?: number;
}

type DialogType = 'none' | 'help' | 'info' | 'reset' | 'error';

interface DialogState {
	type: DialogType;
	title?: string;
	message?: string;
	onConfirm?: () => void;
}

interface NotificationState {
	message: string;
	type: 'info' | 'success' | 'error';
	visible: boolean;
}

const App: React.FC = () => {
	const { exit } = useApp();
	const webcam = React.useMemo(() => new WebcamController(), []);

	const [currentSettings, setCurrentSettings] = useState<WebcamSettings>(
		webcam.getCurrentSettings()
	);
	const [currentFormat, setCurrentFormat] = useState<VideoFormat>(
		webcam.getCurrentVideoFormat()
	);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [deviceBusy, setDeviceBusy] = useState(false);
	const [dialog, setDialog] = useState<DialogState>({ type: 'none' });
	const [notification, setNotification] = useState<NotificationState>({
		message: '',
		type: 'info',
		visible: false
	});

	const settings: SettingItem[] = React.useMemo(() => [
		{
			key: 'resolution',
			label: 'Resolution',
			type: 'select',
			value: `${currentFormat.width}x${currentFormat.height}`,
			options: ['640x480', '800x600', '1024x576', '1280x720', '1920x1080']
		},
		{
			key: 'format',
			label: 'Pixel Format',
			type: 'select',
			value: currentFormat.pixelFormat,
			options: ['YUYV', 'MJPG']
		},
		{
			key: 'framerate',
			label: 'Frame Rate',
			type: 'select',
			value: `${currentFormat.frameRate}fps`,
			options: ['5fps', '10fps', '15fps', '20fps', '24fps', '30fps']
		},
		{
			key: 'brightness',
			label: 'Brightness',
			type: 'range',
			value: currentSettings.brightness,
			min: 0,
			max: 255,
			step: 1
		},
		{
			key: 'contrast',
			label: 'Contrast',
			type: 'range',
			value: currentSettings.contrast,
			min: 0,
			max: 255,
			step: 1
		},
		{
			key: 'saturation',
			label: 'Saturation',
			type: 'range',
			value: currentSettings.saturation,
			min: 0,
			max: 255,
			step: 1
		},
		{
			key: 'sharpness',
			label: 'Sharpness',
			type: 'range',
			value: currentSettings.sharpness,
			min: 0,
			max: 255,
			step: 1
		},
		{
			key: 'gain',
			label: 'Gain/ISO',
			type: 'range',
			value: currentSettings.gain,
			min: 0,
			max: 255,
			step: 1
		},
		{
			key: 'autoExposure',
			label: 'Auto Exposure',
			type: 'toggle',
			value: currentSettings.autoExposure
		},
		{
			key: 'exposureValue',
			label: '  └─ Exposure Value',
			type: 'range',
			value: currentSettings.exposureValue,
			min: 3,
			max: 2047,
			step: 1
		},
		{
			key: 'autoFocus',
			label: 'Auto Focus',
			type: 'toggle',
			value: currentSettings.autoFocus
		},
		{
			key: 'focusValue',
			label: '  └─ Focus Value',
			type: 'range',
			value: currentSettings.focusValue,
			min: 0,
			max: 250,
			step: 5
		},
		{
			key: 'autoWhiteBalance',
			label: 'Auto White Balance',
			type: 'toggle',
			value: currentSettings.autoWhiteBalance
		},
		{
			key: 'whiteBalanceValue',
			label: '  └─ White Balance Temp',
			type: 'range',
			value: currentSettings.whiteBalanceValue,
			min: 2000,
			max: 6500,
			step: 10
		},
		{
			key: 'powerLineFrequency',
			label: 'Power Line Filter',
			type: 'select',
			value: getPowerLineDisplay(currentSettings.powerLineFrequency),
			options: ['Disabled', '50Hz', '60Hz']
		}
	], [currentSettings, currentFormat]);

	const refreshSettings = useCallback(() => {
		setCurrentSettings(webcam.getCurrentSettings());
		setCurrentFormat(webcam.getCurrentVideoFormat());
		const deviceStatus = webcam.getDeviceStatus();
		setDeviceBusy(deviceStatus.inUse);
	}, [webcam]);

	const shouldShowSetting = useCallback((key: string): boolean => {
		switch (key) {
			case 'exposureValue':
				return !currentSettings.autoExposure;
			case 'focusValue':
				return !currentSettings.autoFocus;
			case 'whiteBalanceValue':
				return !currentSettings.autoWhiteBalance;
			default:
				return true;
		}
	}, [currentSettings]);

	const isManualControlDisabled = useCallback((key: string): boolean => {
		switch (key) {
			case 'exposureValue':
				return currentSettings.autoExposure;
			case 'focusValue':
				return currentSettings.autoFocus;
			case 'whiteBalanceValue':
				return currentSettings.autoWhiteBalance;
			default:
				return false;
		}
	}, [currentSettings]);

	const showNotification = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
		setNotification({ message, type, visible: true });
		setTimeout(() => {
			setNotification(prev => ({ ...prev, visible: false }));
		}, 2000);
	}, []);

	const applySetting = useCallback((key: string, value: any) => {
		switch (key) {
			case 'brightness':
				webcam.setBrightness(value);
				break;
			case 'contrast':
				webcam.setContrast(value);
				break;
			case 'saturation':
				webcam.setSaturation(value);
				break;
			case 'sharpness':
				webcam.setSharpness(value);
				break;
			case 'gain':
				webcam.setGain(value);
				break;
			case 'autoExposure':
				webcam.setAutoExposure(value);
				break;
			case 'exposureValue':
				webcam.setExposureValue(value);
				break;
			case 'autoFocus':
				webcam.setAutoFocus(value);
				break;
			case 'focusValue':
				webcam.setFocusValue(value);
				break;
			case 'autoWhiteBalance':
				webcam.setAutoWhiteBalance(value);
				break;
			case 'whiteBalanceValue':
				webcam.setWhiteBalanceValue(value);
				break;
		}
		refreshSettings();
	}, [webcam, refreshSettings]);

	const applySelectSetting = useCallback((key: string, value: string) => {
		switch (key) {
			case 'resolution':
				const [width, height] = value.split('x').map(Number);
				const currentFormat = settings.find(s => s.key === 'format')?.value as string || 'MJPG';
				const formatResult = webcam.setVideoFormat(width, height, currentFormat);
				if (!formatResult.success && formatResult.error === 'DEVICE_BUSY') {
					showNotification('Cannot change resolution: camera is in use', 'error');
				}
				break;
			case 'format':
				const currentRes = settings.find(s => s.key === 'resolution')?.value as string || '1920x1080';
				const [w, h] = currentRes.split('x').map(Number);
				const formatChangeResult = webcam.setVideoFormat(w, h, value);
				if (!formatChangeResult.success && formatChangeResult.error === 'DEVICE_BUSY') {
					showNotification('Cannot change pixel format: camera is in use', 'error');
				}
				break;
			case 'framerate':
				const fps = parseInt(value.replace('fps', ''));
				const frameRateResult = webcam.setFrameRate(fps);
				if (!frameRateResult.success && frameRateResult.error === 'DEVICE_BUSY') {
					showNotification('Cannot change frame rate: camera is in use', 'error');
				}
				break;
			case 'powerLineFrequency':
				let freq = 0;
				switch (value) {
					case '50Hz': freq = 1; break;
					case '60Hz': freq = 2; break;
					default: freq = 0; break;
				}
				webcam.setPowerLineFrequency(freq);
				break;
		}
		refreshSettings();
	}, [webcam, settings, refreshSettings, showNotification]);

	const adjustCurrentSetting = useCallback((delta: number) => {
		const visibleSettings = settings.filter(s => shouldShowSetting(s.key));
		const setting = visibleSettings[selectedIndex];
		if (!setting) return;

		const isFormatSetting = ['resolution', 'format', 'framerate'].includes(setting.key);

		if (deviceBusy && isFormatSetting) {
			showNotification('Cannot change: camera is in use', 'error');
			return;
		}

		if (isManualControlDisabled(setting.key)) {
			const autoSetting = getAutoSettingName(setting.key);
			showNotification(`Cannot adjust: ${autoSetting} is enabled`, 'error');
			return;
		}

		switch (setting.type) {
			case 'range':
				const step = setting.step || 1;
				const min = setting.min || 0;
				const max = setting.max || 255;
				const newValue = Math.max(min, Math.min(max, (setting.value as number) + (delta * step)));
				applySetting(setting.key, newValue);
				break;
			case 'select':
				if (setting.options) {
					const currentIndex = setting.options.indexOf(setting.value as string);
					const newIndex = Math.max(0, Math.min(setting.options.length - 1, currentIndex + delta));
					applySelectSetting(setting.key, setting.options[newIndex]);
				}
				break;
			case 'toggle':
				applySetting(setting.key, !(setting.value as boolean));
				break;
		}
	}, [settings, selectedIndex, deviceBusy, shouldShowSetting, isManualControlDisabled, applySetting, applySelectSetting, showNotification]);

	const applyOptimalSettings = useCallback(() => {
		showNotification('Applying optimal settings...', 'info');
		const result = webcam.applyOptimalSettings();
		refreshSettings();

		if (result.success) {
			showNotification('Optimal settings applied successfully!', 'success');
		} else {
			if (result.errors.length > 0) {
				setDialog({
					type: 'error',
					title: 'Optimal Settings - Partial Success',
					message: result.errors.join('. ') + '.'
				});
			} else {
				showNotification('Failed to apply optimal settings', 'error');
			}
		}
	}, [webcam, refreshSettings, showNotification]);

	const resetToDefaults = useCallback(() => {
		showNotification('Resetting to factory defaults...', 'info');
		const result = webcam.resetToDefaults();
		refreshSettings();

		if (result.success) {
			showNotification('Factory defaults restored successfully!', 'success');
		} else {
			if (result.errors.length > 0) {
				setDialog({
					type: 'error',
					title: 'Reset to Defaults - Partial Success',
					message: result.errors.join('. ') + '.'
				});
			} else {
				showNotification('Failed to reset to defaults', 'error');
			}
		}
		setDialog({ type: 'none' });
	}, [webcam, refreshSettings, showNotification]);

	useInput((input, key) => {
		if (dialog.type !== 'none') {
			if (dialog.type === 'reset') {
				if (input === 'y' || input === 'Y') {
					setDialog({ type: 'none' });
					resetToDefaults();
				} else if (input === 'n' || input === 'N' || key.escape) {
					setDialog({ type: 'none' });
				}
			} else {
				if (key.return || key.escape || input === 'q') {
					setDialog({ type: 'none' });
				}
			}
			return;
		}

		const visibleSettings = settings.filter(s => shouldShowSetting(s.key));

		if (key.upArrow) {
			setSelectedIndex(Math.max(0, selectedIndex - 1));
		} else if (key.downArrow) {
			setSelectedIndex(Math.min(visibleSettings.length - 1, selectedIndex + 1));
		} else if (key.leftArrow) {
			adjustCurrentSetting(-1);
		} else if (key.rightArrow) {
			adjustCurrentSetting(1);
		} else if (key.return) {
			adjustCurrentSetting(0);
		} else if (key.pageUp) {
			adjustCurrentSetting(-10);
		} else if (key.pageDown) {
			adjustCurrentSetting(10);
		} else if (input === 'o' || input === 'O') {
			applyOptimalSettings();
		} else if (input === 'r' || input === 'R') {
			setDialog({
				type: 'reset',
				title: 'Reset to Factory Defaults',
				message: 'This will reset all settings to factory defaults.\nAre you sure you want to continue?'
			});
		} else if (input === 'i' || input === 'I') {
			setDialog({
				type: 'info',
				title: 'Detailed Camera Information',
				message: webcam.getDetailedInfo()
			});
		} else if (input === 'h' || input === 'H' || input === '?') {
			setDialog({ type: 'help' });
		} else if (input === 'q' || input === 'Q' || (key.ctrl && input === 'c')) {
			exit();
		}
	});

	const visibleSettings = settings.filter(s => shouldShowSetting(s.key));
	const currentSetting = visibleSettings[selectedIndex];

	if (dialog.type !== 'none') {
		return (
			<Box flexDirection="column" padding={1}>
				{dialog.type === 'help' && <HelpDialog />}
				{dialog.type === 'info' && <InfoDialog message={dialog.message || ''} />}
				{dialog.type === 'reset' && <ConfirmDialog title={dialog.title || ''} message={dialog.message || ''} />}
				{dialog.type === 'error' && <ErrorDialog title={dialog.title || ''} message={dialog.message || ''} />}
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1} marginBottom={1}>
				<Box flexDirection="column" width="100%">
					<Box justifyContent="center">
						<Text bold color="cyan">🎥 LogiCam Control</Text>
					</Box>
					<Box justifyContent="center">
						<Text dimColor>Logitech C920 Professional Webcam Controller</Text>
					</Box>
				</Box>
			</Box>

			{/* Main Layout: Left (Device Info) + Right (Settings) */}
			<Box gap={2} marginBottom={1}>
				{/* Left Panel - Device Info & Status */}
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor={deviceBusy ? 'red' : 'green'}
					paddingX={2}
					paddingY={1}
					width={35}
				>
					<Text bold color="cyan">📹 Device Information</Text>
					<Box height={1} />

					<Text dimColor>Device Path:</Text>
					<Text color="white">  /dev/video0</Text>
					<Box height={1} />

					<Text dimColor>Model:</Text>
					<Text color="white">  Logitech C920</Text>
					<Box height={1} />

					<Text dimColor>Status:</Text>
					{deviceBusy ? (
						<Text color="red" bold>  ⚠ IN USE</Text>
					) : (
						<Text color="green" bold>  ✓ Available</Text>
					)}
					<Box height={1} />

					<Box borderStyle="single" borderColor="gray" paddingX={1} paddingY={0}>
						<Box flexDirection="column">
							<Text bold color="yellow">Current Format</Text>
							<Text dimColor>Resolution: <Text color="white">{currentFormat.width}x{currentFormat.height}</Text></Text>
							<Text dimColor>Pixel Format: <Text color="white">{currentFormat.pixelFormat}</Text></Text>
							<Text dimColor>Frame Rate: <Text color="white">{currentFormat.frameRate} fps</Text></Text>
						</Box>
					</Box>

					<Box height={1} />

					<Box borderStyle="single" borderColor="gray" paddingX={1} paddingY={0}>
						<Box flexDirection="column">
							<Text bold color="yellow">Quick Stats</Text>
							<Text dimColor>Brightness: <Text color="white">{currentSettings.brightness}/255</Text></Text>
							<Text dimColor>Contrast: <Text color="white">{currentSettings.contrast}/255</Text></Text>
							<Text dimColor>Saturation: <Text color="white">{currentSettings.saturation}/255</Text></Text>
						</Box>
					</Box>
				</Box>

				{/* Right Panel - Settings */}
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor="magenta"
					paddingX={2}
					paddingY={1}
					flexGrow={1}
				>
					<Text bold color="magenta">⚙️  Camera Settings & Configuration</Text>
					<Box height={1} />

					{visibleSettings.map((setting, index) => {
						const isFormatSetting = ['resolution', 'format', 'framerate'].includes(setting.key);
						const isLocked = deviceBusy && isFormatSetting;
						const isDisabled = isManualControlDisabled(setting.key);

						return (
							<SettingRow
								key={setting.key}
								setting={setting}
								isSelected={index === selectedIndex}
								isLocked={isLocked}
								isDisabled={isDisabled}
							/>
						);
					})}
				</Box>
			</Box>

			{/* Bottom - Keyboard Shortcuts */}
			<Box borderStyle="round" borderColor="yellow" paddingX={2} paddingY={1}>
				<Box flexDirection="column" width="100%">
					<Box justifyContent="space-between">
						<Box gap={1}>
							<Text color="yellow" bold>Navigation:</Text>
							<Text dimColor>↑↓ Select</Text>
							{currentSetting?.type === 'range' && (
								<>
									<Text dimColor>•</Text>
									<Text dimColor>←→ Adjust ±{currentSetting.step || 1}</Text>
									<Text dimColor>•</Text>
									<Text dimColor>PgUp/Dn ±10</Text>
								</>
							)}
							{currentSetting?.type === 'toggle' && (
								<>
									<Text dimColor>•</Text>
									<Text dimColor>⏎ Toggle</Text>
								</>
							)}
							{currentSetting?.type === 'select' && (
								<>
									<Text dimColor>•</Text>
									<Text dimColor>←→ Change</Text>
								</>
							)}
						</Box>
						<Box gap={1}>
							<Text color="yellow" bold>Quick Actions:</Text>
							<Text dimColor>[O] Optimize</Text>
							<Text dimColor>•</Text>
							<Text dimColor>[R] Reset</Text>
							<Text dimColor>•</Text>
							<Text dimColor>[I] Info</Text>
							<Text dimColor>•</Text>
							<Text dimColor>[H] Help</Text>
							<Text dimColor>•</Text>
							<Text dimColor>[Q] Quit</Text>
						</Box>
					</Box>
				</Box>
			</Box>

			{/* Notification Toast */}
			{notification.visible && (
				<Box
					position="absolute"
					top={50}
					left={50}
					borderStyle="round"
					borderColor={notification.type === 'success' ? 'green' : notification.type === 'error' ? 'red' : 'yellow'}
					paddingX={3}
					paddingY={1}
				>
					<Text color={notification.type === 'success' ? 'green' : notification.type === 'error' ? 'red' : 'yellow'} bold>
						{notification.type === 'success' && '✓ '}
						{notification.type === 'error' && '✗ '}
						{notification.type === 'info' && 'ℹ '}
						{notification.message}
					</Text>
				</Box>
			)}
		</Box>
	);
};

const SettingRow: React.FC<{
	setting: SettingItem;
	isSelected: boolean;
	isLocked: boolean;
	isDisabled: boolean;
}> = ({ setting, isSelected, isLocked, isDisabled }) => {
	let valueDisplay = '';
	let valueColor = 'white';

	switch (setting.type) {
		case 'range':
			const value = setting.value as number;
			const max = setting.max || 255;
			const percentage = Math.round((value / max) * 100);
			const progressBar = createProgressBar(value, max, 20);

			if (isDisabled) {
				valueDisplay = `${progressBar} ${value.toString().padStart(4, ' ')} ${String(percentage).padStart(3, ' ')}%`;
				valueColor = 'gray';
			} else {
				valueDisplay = `${progressBar} ${value.toString().padStart(4, ' ')} ${String(percentage).padStart(3, ' ')}%`;
				valueColor = percentage > 66 ? 'green' : percentage > 33 ? 'yellow' : 'red';
			}
			break;
		case 'toggle':
			valueDisplay = (setting.value as boolean) ? '● ON ' : '○ OFF';
			valueColor = (setting.value as boolean) ? 'green' : 'red';
			break;
		case 'select':
			if (isLocked) {
				valueDisplay = `${setting.value} 🔒`;
				valueColor = 'gray';
			} else {
				valueDisplay = `${setting.value}`;
				valueColor = 'cyan';
			}
			break;
	}

	return (
		<Box marginBottom={0}>
			<Box width="100%">
				{isSelected ? (
					<Text backgroundColor="white" color="black" bold>
						▶ {setting.label.padEnd(28, ' ')} {valueDisplay}
					</Text>
				) : (
					<>
						<Text dimColor>  {setting.label.padEnd(28, ' ')}</Text>
						<Text color={valueColor}>{valueDisplay}</Text>
					</>
				)}
			</Box>
		</Box>
	);
};

const HelpDialog: React.FC = () => (
	<Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={3} paddingY={2}>
		<Text bold color="cyan">📖 LogiCam Control - Help</Text>
		<Box height={1} />

		<Text bold color="yellow">Keyboard Navigation</Text>
		<Text dimColor>  ↑ ↓          Navigate between settings</Text>
		<Text dimColor>  ← →          Adjust values / Change options</Text>
		<Text dimColor>  Enter        Toggle boolean settings</Text>
		<Text dimColor>  PgUp / PgDn  Adjust by ±10 (for range values)</Text>
		<Box height={1} />

		<Text bold color="yellow">Quick Actions</Text>
		<Text dimColor>  O            Apply optimal settings for best quality</Text>
		<Text dimColor>  R            Reset all settings to factory defaults</Text>
		<Text dimColor>  I            Show detailed camera information</Text>
		<Text dimColor>  H / ?        Show this help screen</Text>
		<Text dimColor>  Q / Ctrl+C   Quit application</Text>
		<Box height={1} />

		<Text bold color="yellow">Setting Types</Text>
		<Text dimColor>  Range        Numeric values with progress bars</Text>
		<Text dimColor>  Toggle       Boolean ON/OFF switches</Text>
		<Text dimColor>  Select       Predefined option lists</Text>
		<Box height={1} />

		<Text bold color="yellow">Optimal Settings</Text>
		<Text dimColor>  • 1920x1080 @ 30fps in MJPG format</Text>
		<Text dimColor>  • Auto exposure, focus, and white balance</Text>
		<Text dimColor>  • Balanced picture quality settings</Text>
		<Text dimColor>  • 60Hz power line filter (for most regions)</Text>
		<Box height={1} />

		<Box justifyContent="center">
			<Text color="gray" italic>Press any key to close</Text>
		</Box>
	</Box>
);

const InfoDialog: React.FC<{ message: string }> = ({ message }) => (
	<Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={3} paddingY={2}>
		<Text bold color="cyan">📊 Detailed Camera Information</Text>
		<Box height={1} />
		<Text>{message}</Text>
		<Box height={1} />
		<Box justifyContent="center">
			<Text color="gray" italic>Press any key to close</Text>
		</Box>
	</Box>
);

const ConfirmDialog: React.FC<{ title: string; message: string }> = ({ title, message }) => (
	<Box flexDirection="column" borderStyle="double" borderColor="red" paddingX={4} paddingY={2}>
		<Text bold color="red">⚠️  {title}</Text>
		<Box height={1} />
		{message.split('\n').map((line, i) => (
			<Text key={i}>{line}</Text>
		))}
		<Box height={1} />
		<Box justifyContent="center" gap={3}>
			<Text backgroundColor="green" color="black" bold> Y  Yes </Text>
			<Text backgroundColor="red" color="black" bold> N  No </Text>
		</Box>
	</Box>
);

const ErrorDialog: React.FC<{ title: string; message: string }> = ({ title, message }) => (
	<Box flexDirection="column" borderStyle="double" borderColor="yellow" paddingX={3} paddingY={2} width={80}>
		<Text bold color="yellow">⚠️  {title}</Text>
		<Box height={1} />
		<Text color="yellow">{message}</Text>
		<Box height={1} />
		<Text dimColor>Some settings could not be changed because the camera is being used</Text>
		<Text dimColor>by another application. Close those applications and try again.</Text>
		<Box height={1} />
		<Box justifyContent="center">
			<Text color="gray" italic>Press any key to continue</Text>
		</Box>
	</Box>
);

function createProgressBar(value: number, max: number, width: number = 20): string {
	const filled = Math.round((value / max) * width);
	const empty = width - filled;
	return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

function getPowerLineDisplay(frequency: number): string {
	switch (frequency) {
		case 0: return 'Disabled';
		case 1: return '50Hz';
		case 2: return '60Hz';
		default: return 'Unknown';
	}
}

function getAutoSettingName(manualKey: string): string {
	switch (manualKey) {
		case 'exposureValue':
			return 'Auto Exposure';
		case 'focusValue':
			return 'Auto Focus';
		case 'whiteBalanceValue':
			return 'Auto White Balance';
		default:
			return 'Auto setting';
	}
}

export class WebcamTUI {
	private webcam: WebcamController;

	constructor() {
		this.webcam = new WebcamController();
	}

	public run(): void {
		// Check dependencies
		const missing = this.webcam.checkDependencies();

		if (missing.length > 0) {
			console.error(`Missing dependencies: ${missing.join(', ')}`);
			console.error('Please install: sudo apt install ' + missing.join(' '));
			process.exit(1);
		}

		// Check device
		if (!this.webcam.checkDevice()) {
			console.error('Logitech C920 webcam not found at /dev/video0');
			console.error('Please ensure your webcam is connected.');
			process.exit(1);
		}

		render(<App />);
	}
}
