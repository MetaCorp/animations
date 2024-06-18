import fs from 'fs'

import * as MFunction from 'fp-ts/lib/function.js'
const { pipe, flow, identity } = MFunction
// import { values } from 'fp-ts/lib/map';
// import { Ord, fromCompare, ordNumber, contramap } from 'fp-ts/Ord';
// import { fold, none, option, some, getApplySemigroup } from 'fp-ts/lib/Option';

// import { Eq } from 'fp-ts/Eq';
import { some } from 'fp-ts/lib/Option.js'

import * as MArray from 'fp-ts/lib/Array.js'
const {
  head,
  findFirst,
  map: amap,
  filter,
  mapWithIndex: amapWithIndex,
} = MArray

import * as S from 'fp-ts/lib/string.js'

import * as MRecord from 'fp-ts/lib/Record.js'
const { keys, map: rmap, mapWithIndex: rmapWithIndex } = MRecord

import MSRecord from 'fp-ts-std/Record'
const { values, omit, pick } = MSRecord

import * as MOption from 'fp-ts/lib/Option.js'
const { getOrElse } = MOption

import * as IO from 'fp-ts-std/IO'
import { tap } from 'fp-ts-std/IO'

import MSFunction from 'fp-ts-std/Function'
const { ifElse } = MSFunction

import { incrBar, initBar, stopBar } from '../utils/cliProgress.js'
import { getEntity } from '../optimisationEngine/utils/getEntity.js'

const log = (name) => (o) => {
  console.log(name, o)
  return o
}
// const hasNestedObj = pipe(
//   values,
//   map(type),
//   includes('Object'), //=> true
// )

const type = (o) => typeof o
const isObject = flow(type, (t) => t === 'object')

const has = (fn) => (a) => findFirst(fn)(a)._tag !== 'None'

export const hasNestedObj = flow(values, has(isObject))

export const keysStartingWith = (str) => flow(keys, filter(S.startsWith(str)))

const keepArg = (total, fn) => (arg) => {
  return fn(arg)(arg)
}
// const sanitizeObj = keepArg(1, pipe(keysStartingWith('_'), omit))
const sanitizeObj = keepArg(1, flow(keysStartingWith('_'), omit))

export const sanitizeObjRec = (obj) =>
  ifElse(flow(sanitizeObj, rmap(sanitizeObjRec)))(identity)(isObject)(obj)

const prop = (k) => (o) => o[k]

// const getFirstEntityKeys = flow(
//   head,
//   getOrElse(() => ({})),
//   keys,
// )

// const reduceObj2 = (fn) => (o) =>
//   flow(
//     getFirstEntityKeys,
//     reduce({}, (acc, k: string) => ({
//       ...acc,
//       [k]: amap(prop(k))(o),
//     })),
//     mapWithIndex((k, v) => fn(v)),
//   )(o)

export const reduceObj2 = (fn) => (a) =>
  flow(
    // fpLog('reduceObj2 1', undefined, { logType: 'fs' }),
    getEntity,
    // fpLog('reduceObj2 2', undefined, { logType: 'fs' }),
    // getOrElse(() => ({})),
    // fpLog('reduceObj2 3', undefined, { logType: 'fs' }),
    rmapWithIndex((k, _) => amap(fn(prop(k)))(a)),
    // fpLog('reduceObj2 4', undefined, { logType: 'fs' }),
  )(a)

export const listObjToArrayList = reduceObj2((v) => v)

// excludeFieldsFromArray

export const excludeFieldsAr = (fields) => amap(omit(fields))
export const pickFieldsAr = (fields) => amap(pick(fields))

export const objArrayToFieldArray = (field) => amap((o) => o[field])

// arrayListToArrayObj
// export const arrayListToArrayObj = (o) => {
//   const ret = []

//   rmapWithIndex((k, v: number[]) =>
//     amapWithIndex((i: number, e) => {
//       if (!ret[i]) ret.push({})
//       ret[i][k] = e
//     })(v),
//   )(o)

//   return ret
// }

const myReduceObj = (initValue, fn) => (o) => {
  const acc = initValue

  rmapWithIndex(fn(acc))(o)

  return acc
}

export const arrayListToArrayObj = myReduceObj(
  [],
  (acc) => (k, v: number[]) =>
    amapWithIndex((i: number, e) => {
      if (!acc[i]) acc.push({})
      acc[i][k] = e
    })(v),
)

export const flowA =
  (...fns) =>
  async (initial) => {
    let ret = initial

    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i]
      ret = await Promise.resolve(fn(ret))
    }

    return ret
  }

export const pipeA = async (...fns) => {
  let ret = null

  for (let i = 0; i < fns.length; i++) {
    const fn = fns[i]
    ret = await Promise.resolve(fn(ret))
  }

  return ret
}

export const mapA = (fn) => async (array) => {
  const ret = []

  for (let i = 0; i < array.length; i++) {
    const el = array[i]
    ret.push(await Promise.resolve(fn(el)))
  }

  return ret
}

export const mapAWithProgress = (name) => (fn) => async (array) => {
  initBar(name, array.length)

  const ret = []

  for (let i = 0; i < array.length; i++) {
    const el = array[i]
    const newFnRet = await Promise.resolve(fn(el))
    ret.push(newFnRet)
    incrBar(name)
  }

  stopBar(name)

  return ret
}

// TODO: better deep merge
export const merge = (o1) => (o2) => ({ ...o1, ...o2 })
export const mergeDeep = (target) => (source) => {
  let output = Object.assign({}, target)
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] })
        else output[key] = mergeDeep(target[key])(source[key])
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  return output
}

export const fpLog =
  (name, fnOrObj: ((any) => any) | any = (d) => d, opts = { logType: 'log' }) =>
  (data) => {
    opts.logType === 'log' &&
      console.log(name, typeof fnOrObj === 'function' ? fnOrObj(data) : fnOrObj)
    opts.logType === 'fs' &&
      fs.writeFileSync(
        `${name}.json`,
        data
          ? JSON.stringify(
              typeof fnOrObj === 'function' ? fnOrObj(data) : fnOrObj,
              null,
              2,
            )
          : '',
      )
    return data
  }

// can modify each k of an object based on object[k] (see dotNotationConfigToHconfig)
export const reduceObj = (fn) => (obj) => {
  const ret: any = {}

  flow(
    keys,
    amap((k) => (ret[k] = fn(obj[k]))),
  )(obj)

  return ret
}

// can assign custom key to ret
export const reduceObjArrayWoK =
  (fn, mergeFn = merge) =>
  (obj) => {
    let ret = {}

    flow(amap((el: any) => (ret = mergeFn(ret)(fn(el)))))(obj)

    return ret
  }

// can assign custom key to ret
export const reduceObjWoK =
  (fn, mergeFn = merge) =>
  (obj) => {
    let ret = {}

    flow(
      keys,
      amap((k) => (ret = mergeFn(ret)(fn(k, obj[k])))),
    )(obj)

    return ret
  }

// can assign custom key to ret
export const reduceObjWoKA =
  (fn, mergeFn = merge) =>
  async (obj) => {
    let ret = {}

    await flowA(
      keys,
      // fpLog('keys'),
      mapA(async (k) => (ret = mergeFn(ret)(await fn(k, obj[k])))),
      // fpLog('after mapA'),
    )(obj)

    return ret
  }

// can assign custom key to ret
export const reduceObjToArrayA =
  (fn, mergeFn = merge) =>
  async (obj) => {
    let ret = []

    await flowA(
      keys,
      // fpLog('keys'),
      mapA(async (k) => ret.push(await fn(k, obj[k]))),
      // fpLog('after mapA'),
    )(obj)

    return ret
  }

export const createObjFromFnCall =
  (objFn) =>
  (fn) =>
  async (...params) =>
    objFn(await fn(...params))

// * Keep only 1 on n el out of all
export const roundArray =
  (n) =>
  (a): any[] =>
    a.filter((_, i) => i % n === 0)

export const changeArrayField = (field, fn) =>
  amap((el: any) => ({ ...el, [field]: fn(el[field]) }))

export const changeArrayFields = (fields) =>
  amap((el: any) => {
    const el2 = { ...el }

    for (const [field, fn] of Object.entries(fields) as [any, (any) => any]) {
      el2[field] = fn(el2[field])
    }

    return el2
  })
