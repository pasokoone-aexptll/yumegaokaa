#!/bin/sh
set -eu
swiftc -module-cache-path /tmp/yumegaoka-swift-cache apps/mobile/modules/presence-native/ios/ObservationCore.swift tests/native/main.swift -o /tmp/yumegaoka-core-tests
/tmp/yumegaoka-core-tests
swiftc -parse-as-library -module-cache-path /tmp/yumegaoka-swift-cache apps/mobile/modules/presence-native/ios/ServiceError.swift apps/mobile/modules/presence-native/ios/VisitLifecycle.swift tests/lifecycle/main.swift -o /tmp/yumegaoka-lifecycle-tests
/tmp/yumegaoka-lifecycle-tests
