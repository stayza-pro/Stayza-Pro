// i18n routing removed for MVP. Provide lightweight stubs to avoid runtime errors.
export const routing = {
  locales: ["en"],
  defaultLocale: "en",
  pathnames: { "/": "/" },
};

export const Link = (props: any) => props.children;
