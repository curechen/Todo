#!/usr/bin/env bash
#
# 小陈待办 - 本地打包 Release APK
#
# 用法：
#   ./scripts/build-apk.sh                 # 默认 arm64-v8a
#   ABI=all ./scripts/build-apk.sh         # 四合一通用包（体积更大）
#   ABI=armeabi-v7a ./scripts/build-apk.sh # 32 位老机型
#
# 依赖：
#   - JDK 17
#   - Android SDK Platform 37.0 / Build-Tools 37.0.0
#   - NDK 27.1.12297006 / CMake 3.22.1
#   - Node.js（以及已安装的 node_modules）
#
# 脚本会优先使用项目内的 .android-sdk（如果存在），否则使用 ANDROID_HOME
# 或 ~/Library/Android/sdk。构建缓存放在项目内 .gradle/。

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---- JDK 17 ----
if [ -x /usr/libexec/java_home ]; then
  DETECTED_JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
  if [ -n "${DETECTED_JAVA_HOME}" ]; then
    JAVA_HOME="${DETECTED_JAVA_HOME}"
  fi
fi

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "${JAVA_HOME}/bin/java" ]; then
  echo "错误：找不到 JDK 17。请安装 JDK 17 并设置 JAVA_HOME。" >&2
  exit 1
fi

export JAVA_HOME
export PATH="${JAVA_HOME}/bin:${PATH}"

# ---- Android SDK ----
if [ -d "${ROOT}/.android-sdk/platforms" ]; then
  SDK_DIR="${ROOT}/.android-sdk"
elif [ -n "${ANDROID_HOME:-}" ]; then
  SDK_DIR="${ANDROID_HOME}"
elif [ -n "${ANDROID_SDK_ROOT:-}" ]; then
  SDK_DIR="${ANDROID_SDK_ROOT}"
else
  SDK_DIR="${HOME}/Library/Android/sdk"
fi

if [ ! -d "${SDK_DIR}" ]; then
  echo "错误：找不到 Android SDK：${SDK_DIR}" >&2
  exit 1
fi

export ANDROID_HOME="${SDK_DIR}"
export ANDROID_SDK_ROOT="${SDK_DIR}"

if [ -d "${ROOT}/android" ]; then
  printf 'sdk.dir=%s\n' "${SDK_DIR}" > "${ROOT}/android/local.properties"
else
  echo "错误：缺少 android/ 目录。先运行：npx expo prebuild --platform android" >&2
  exit 1
fi

MISSING=0
if [ ! -d "${SDK_DIR}/platforms/android-37.0" ] && [ ! -d "${SDK_DIR}/platforms/android-37" ]; then
  echo "缺少 Android SDK Platform 37.0" >&2
  MISSING=1
fi
if [ ! -d "${SDK_DIR}/build-tools/37.0.0" ]; then
  echo "缺少 Build-Tools 37.0.0" >&2
  MISSING=1
fi
if [ ! -d "${SDK_DIR}/ndk/27.1.12297006" ]; then
  echo "缺少 NDK 27.1.12297006" >&2
  MISSING=1
fi
if [ ! -d "${SDK_DIR}/cmake/3.22.1" ]; then
  echo "缺少 CMake 3.22.1" >&2
  MISSING=1
fi
if [ "${MISSING}" -ne 0 ]; then
  echo "请先在 ${SDK_DIR} 安装上述 SDK 组件。" >&2
  exit 1
fi

# ---- Node ----
if ! command -v node >/dev/null 2>&1; then
  echo "错误：找不到 Node.js。" >&2
  exit 1
fi
if [ ! -d "${ROOT}/node_modules" ]; then
  echo "错误：缺少 node_modules，先运行 npm install。" >&2
  exit 1
fi

# ---- ABI ----
ABI="${ABI:-arm64-v8a}"
if [ "${ABI}" = "all" ]; then
  ARCHS="armeabi-v7a,arm64-v8a,x86,x86_64"
  LABEL="universal"
else
  ARCHS="${ABI}"
  case "${ABI}" in
    arm64-v8a) LABEL="arm64" ;;
    armeabi-v7a) LABEL="armeabi" ;;
    x86) LABEL="x86" ;;
    x86_64) LABEL="x86_64" ;;
    *) LABEL="$(printf '%s' "${ABI}" | tr -c 'a-zA-Z0-9_' '_')" ;;
  esac
fi

# ---- Build ----
export GRADLE_USER_HOME="${ROOT}/.gradle"
export CI=1
export NODE_ENV=production
export EXPO_NO_TELEMETRY=1

mkdir -p "${GRADLE_USER_HOME}" "${ROOT}/artifacts"

echo "使用 JDK: ${JAVA_HOME}"
echo "使用 SDK: ${SDK_DIR}"
echo "构建 ABI: ${ARCHS}"
echo

cd "${ROOT}/android"
./gradlew :app:assembleRelease -PreactNativeArchitectures="${ARCHS}" --console=plain

APK="${ROOT}/android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "${APK}" ]; then
  echo "错误：构建结束但找不到 APK：${APK}" >&2
  exit 1
fi

VERSION="$(cd "${ROOT}" && node -p "require('./package.json').version")"
OUT="${ROOT}/artifacts/xiaochen-todo-${VERSION}-${LABEL}.apk"
cp "${APK}" "${OUT}"

echo
echo "APK 已生成：${OUT}"
if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "${OUT}"
elif command -v sha256sum >/dev/null 2>&1; then
  sha256sum "${OUT}"
fi
