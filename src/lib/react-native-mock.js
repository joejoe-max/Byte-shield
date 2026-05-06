export const NativeModules = {};
export const Platform = {
  OS: 'web',
  select: (obj) => obj.web || obj.default,
};
export default {
  NativeModules,
  Platform,
};
