"""Build an isolated Simulator picker probe; no account, network, or photo writes.
Run: python3 experiments/photo-picker-ios/build.py
Install/launch separately with simctl; tap the measurement button and cancel.
Inspect the system log for 'PickerProbe initialized/presented' elapsed ms.
"""
import pathlib
import plistlib
import subprocess

root = pathlib.Path(__file__).resolve().parent
app = pathlib.Path('/tmp/yumegaoka-picker-probe.app')
app.mkdir(exist_ok=True)
with (app / 'Info.plist').open('wb') as output:
    plistlib.dump({
        'CFBundleIdentifier': 'jp.yumegaoka.pickerprobe',
        'CFBundleExecutable': 'PickerProbe',
        'CFBundleName': 'PickerProbe',
        'CFBundlePackageType': 'APPL',
        'CFBundleVersion': '1',
        'CFBundleShortVersionString': '1',
        'MinimumOSVersion': '18.0',
        'UILaunchScreen': {},
        'UIDeviceFamily': [1],
        'UIApplicationSceneManifest': {
            'UIApplicationSupportsMultipleScenes': False,
            'UISceneConfigurations': {},
        },
    }, output)
sdk = subprocess.check_output(
    ['xcrun', '--sdk', 'iphonesimulator', '--show-sdk-path'], text=True,
).strip()
subprocess.run([
    'xcrun', '--sdk', 'iphonesimulator', 'swiftc', '-sdk', sdk,
    '-target', 'arm64-apple-ios18.0-simulator', '-parse-as-library',
    str(root / 'PickerProbe.swift'), '-o', str(app / 'PickerProbe'),
], check=True)
subprocess.run(['codesign', '--force', '--sign', '-', str(app)], check=True)
print(app)
