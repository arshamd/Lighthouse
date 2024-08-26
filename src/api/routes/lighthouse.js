export const lighthouseRoutes = (app, controller) => {
  app.post("/lighthouseAnalyzer", controller.analysis.bind(controller));
};
