require 'xcodeproj'
root=File.expand_path(__dir__)
project=Xcodeproj::Project.new(File.join(root,'Smoke.xcodeproj'))
target=project.new_target(:ui_test_bundle,'Smoke',:ios,'16.4')
file=project.main_group.new_file('Smoke.swift')
target.source_build_phase.add_file_reference(file)
target.build_configurations.each do |c|
 c.build_settings['PRODUCT_BUNDLE_IDENTIFIER']='jp.yumegaoka.smoketests'
 c.build_settings['DEVELOPMENT_TEAM']=ENV.fetch('APPLE_TEAM_ID','8RHW9L5LBF')
 c.build_settings['CODE_SIGN_STYLE']='Automatic'
 c.build_settings['GENERATE_INFOPLIST_FILE']='YES'
 c.build_settings['INFOPLIST_FILE']='Info.plist'
 c.build_settings['SWIFT_VERSION']='5.9'
 c.build_settings['TARGETED_DEVICE_FAMILY']='1'
 c.build_settings['INFOPLIST_KEY_NSLocalNetworkUsageDescription']='ローカル開発サーバーでUI検証を行います'
 c.build_settings['INFOPLIST_KEY_NSAppTransportSecurity_NSAllowsArbitraryLoads']='YES'
end
project.save
scheme=Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.save_as(project.path,'Smoke',true)
