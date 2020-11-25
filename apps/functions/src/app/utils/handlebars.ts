import handlebars from 'handlebars';

handlebars.registerHelper('ternary', function handlebarsTernary(
  this: any,
  test,
  yes,
  no
) {
  return (typeof test === 'function' ? test.call(this) : test) ? yes : no;
});

export { handlebars };
