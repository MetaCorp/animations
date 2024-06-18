export const fromPug = (template: any, data: any = {}) => {
  return template.call(data);
};
