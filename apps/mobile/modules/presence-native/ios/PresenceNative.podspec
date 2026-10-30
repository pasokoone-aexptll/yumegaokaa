Pod::Spec.new do |s|
 s.name = 'PresenceNative'
 s.version = '0.1.0'
 s.summary = 'Yumegaoka background presence'
 s.description = s.summary
 s.license = { :type => 'MIT' }
 s.author = 'yumegaoka'
 s.homepage = 'https://example.invalid/yumegaoka'
 s.platforms = { :ios => '16.4' }
 s.source = { :git => '' }
 s.static_framework = true
 s.dependency 'ExpoModulesCore'
 s.source_files = '**/*.{h,m,mm,swift}'
 s.swift_version = '5.9'
end
