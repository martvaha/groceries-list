import Handlebars from 'handlebars';

Handlebars.registerHelper('ternary', function handlebarsTernary(
  this: unknown,
  test: unknown,
  yes: unknown,
  no: unknown
) {
  return (typeof test === 'function' ? test.call(this) : test) ? yes : no;
});

export { Handlebars as handlebars };
