import React from 'react'
import { useAtom } from "jotai";

import { fromPug } from '../../../utils/pugUtil'
import Pug from './Test.pug'

import { textUpperCaseAtom } from './testStore'

const Test = ({ params }: any) => {
	const [textUpperCase, setTextUpperCase] = useAtom(textUpperCaseAtom)

	return <div>{textUpperCase}</div>// fromPug(Pug, merge(params)({ textUpperCase }))
}

export default Test