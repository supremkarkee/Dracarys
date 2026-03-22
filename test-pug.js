const pug = require('pug');
try {
  const fn = pug.compileFile('app/views/home.pug');
  fn({ 
            title: 'Dracarys – Learn & Grow',
            activePage: 'home',
            heroImage: null,
            featureImages: [],
            stats: { students: '500+', tutors: '120+', rating: '4.9★' },
            featuredTutors: []
  });
  console.log('Success runtime');
} catch(e) {
  console.error(e);
}
