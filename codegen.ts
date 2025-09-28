import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'github-schema.graphql',
  documents: ['server/**/*.ts'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './server/gql/github/': {
      preset: 'client',
      config: {
        useTypeImports: true
      },
      plugins: [],
    },
  },
}

export default config
