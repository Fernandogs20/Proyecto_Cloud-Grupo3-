import { createStyles } from 'antd-style';

const useStyles = createStyles(() => {
  return {
    colorWeak: {
      filter: 'invert(80%)',
    },
    'ant-layout': {
      minHeight: '100vh',
    },
    'ant-pro-sider.ant-layout-sider.ant-pro-sider-fixed': {
      left: 'unset',
    },
    canvas: {
      display: 'block',
    },
    body: {
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    'ul,ol': {
      listStyle: 'none',
    },
    '@media(max-width: 768px)': {
      'ant-pro-sider, ant-pro-sider.ant-layout-sider, ant-pro-sider.ant-layout-sider.ant-pro-sider-fixed':
        {
          left: 0,
          width: 'min(84vw, 320px) !important',
          minWidth: 'min(84vw, 320px) !important',
          maxWidth: 'min(84vw, 320px) !important',
          height: '100vh',
          overflow: 'hidden',
        },
      'ant-pro-sider .ant-layout-sider-children': {
        height: '100vh',
        overflow: 'hidden',
      },
      'ant-pro-sider .ant-menu': {
        maxHeight: 'calc(100vh - 64px)',
        overflowY: 'auto',
        overflowX: 'hidden',
      },
      'ant-pro-sider .ant-menu-item, ant-pro-sider .ant-menu-submenu-title': {
        height: 44,
        marginBlock: 4,
        lineHeight: '44px',
      },
      'ant-pro-sider .ant-menu-title-content': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      'ant-pro-layout .ant-pro-layout-content': {
        margin: 0,
        paddingInline: 12,
      },
      'ant-pro-setting-drawer-handle': {
        display: 'none',
      },
      'ant-table': {
        width: '100%',
        overflowX: 'auto',
        '&-thead > tr,    &-tbody > tr': {
          '> th,      > td': {
            whiteSpace: 'pre',
            '> span': {
              display: 'block',
            },
          },
        },
      },
    },
  };
});

export default useStyles;
