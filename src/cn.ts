import type { CnFunction } from 'cn'
import { createCn } from 'cn/config'

export const cn: CnFunction = createCn({
  extend: {
    classGroups: {
      rounded: ['rounded-control']
    }
  }
})
