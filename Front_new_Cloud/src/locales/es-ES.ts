import component from './es-ES/component';
import globalHeader from './es-ES/globalHeader';
import menu from './es-ES/menu';
import network from './es-ES/network';
import pages from './es-ES/pages';
import settingDrawer from './es-ES/settingDrawer';
import settings from './es-ES/settings';

export default {
  'navBar.lang': 'Idiomas',
  'layout.user.link.help': 'Ayuda',
  'layout.user.link.privacy': 'Privacidad',
  'layout.user.link.terms': 'Términos',
  'app.preview.down.block': 'Descargar esta página al proyecto local',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...network,
  ...component,
  ...pages,
};
