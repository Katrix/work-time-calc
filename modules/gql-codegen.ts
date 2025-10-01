import { defineNuxtModule } from 'nuxt/kit'
import { type CodegenConfig, generate } from '@graphql-codegen/cli'

export default defineNuxtModule<CodegenConfig>({
  meta: { name: 'gql-codegen', configKey: 'gqlCodegen' },
  defaults: {
    documents: ['server/**/*.ts'],
    ignoreNoDocuments: true,
  },
  async setup(moduleOptions, nuxt) {
    await generate(moduleOptions)
  },
})
