<!-- mirrors: docs/coding-rules.md -->

# Coding rules — global

- **Code language**: english — identifiers, comments, logs
- **Naming**: PascalCase for classes/interfaces (prefix `I`), camelCase for methods/variables, PascalCase for enums and their values
- **File naming**: `<Name>.<descriptor>.ts` (e.g. `Organize.service.ts`, `module.base.ts`); Angular templates: `*.template.html`
- **File size**: split files over ~400 lines
- **IoC symbols**: always export a `Symbol<Name>` alongside every interface — e.g. `export const SymbolOrganizeService = Symbol('OrganizeService')`
- **Error handling**: backend uses `try/catch` in `ModuleBase`; TODO: introduce typed error responses
- **Comments**: explain *why*, never *what*
- **Commits**: conventional format, imperative mood, no AI attribution
- **TypeScript**: `strict: true`, `experimentalDecorators: true`, `emitDecoratorMetadata: true` required in backend
- **Algorithm precision**: BinPackingJS requires integer inputs — multiply by `10^5`, divide after
