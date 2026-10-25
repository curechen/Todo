const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNotificationIcon(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const source = path.join(projectRoot, 'assets/notifications/ic_stat_todo.png');
      const target = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/drawable/ic_stat_todo.png'
      );

      if (fs.existsSync(source)) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
      }

      return config;
    },
  ]);
};
