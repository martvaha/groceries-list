import Handlebars from 'handlebars';
Handlebars.registerHelper('ternary', function handlebarsTernary(test, yes, no) {
    return (typeof test === 'function' ? test.call(this) : test) ? yes : no;
});
export { Handlebars as handlebars };
