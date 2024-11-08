const {
  AndroidConfig,
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
  withSettingsGradle,
  withStringsXml,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withUnity = (config) => {
  config = withAppBuildGradleMod(config);
  config = withSettingsGradleMod(config);
  config = withGradlePropertiesMod(config);
  config = withStringsXMLMod(config);
  config = withPodfileDangerousMod(config);
  return config;
};

const withAppBuildGradleMod = (config) =>
  withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents.includes('android {')) {
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        'android {',
        `android {
          sourceSets {
            main {
              jniLibs.srcDirs = ["\${project(':unityLibrary').projectDir}/libs"]
              }
              }\n
              `
      );
    } else {
      throw new Error(
        'Failed to add unityLibrary source sets to the android/app/build.gradle file`'
      );
    }
    return modConfig;
  });

const withSettingsGradleMod = (config) =>
  withSettingsGradle(config, (modConfig) => {
    modConfig.modResults.contents += `
include ':unityLibrary'
project(':unityLibrary').projectDir=new File('../unity/builds/android/unityLibrary')
        `;
    return modConfig;
  });

const withGradlePropertiesMod = (config) =>
  withGradleProperties(config, (modConfig) => {
    modConfig.modResults.find(result => result.key === 'org.gradle.jvmargs').value = '-Xmx4096M'
    modConfig.modResults.push({
      type: 'property',
      key: 'unityStreamingAssets',
      value: '.unity3d',
    });
    return modConfig;
  });

// add string
const withStringsXMLMod = (config) =>
  withStringsXml(config, (modConfig) => {
    modConfig.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          _: 'Game View',
          $: {
            name: 'game_view_content_description',
          },
        },
      ],
      modConfig.modResults
    );
    return modConfig;
  });

/*
        Adjust the Podfile to exclude arm64 architecture for simulator builds
        for all the pods in the project
        This is also necessary in order to get the Unity project to build for simulator
        */
const withPodfileDangerousMod = (config) =>
  withDangerousMod(config, [
    'ios',
    (modConfig) => {
      /*
            We need to do a 'dangerous' mod to the Podfile
            and add lines to the post install hook to exclude arm64 architecture for simulator builds
            */
      const file = path.join(
        modConfig.modRequest.platformProjectRoot,
        'Podfile'
      );
      const contents = fs.readFileSync(file).toString();

      // look for the closing bracket of the `react_native_post_install` block, insert stuff on the following lines
      const regex = /react_native_post_install\([^)]+\)\s*/;
      const newLine = `
      installer.pods_project.build_configurations.each do |config|
        config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = "arm64"
      end\n\n`;

      const newContents = contents.replace(regex, '$&\n' + newLine);
      fs.writeFileSync(file, newContents);
      return modConfig;
    },
  ]);

module.exports = withUnity;
