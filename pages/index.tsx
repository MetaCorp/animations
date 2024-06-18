import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Test from '../components/organisms/Test/Test'
import styles from '../styles/Home.module.css'
import { fromPug } from '../utils/pugUtil'

import Pug from './index.pug'

const Home: NextPage = () => {
  const params = {
    period: {
      start: 'start',
      end: 'end',
    },
    items: [{
      name: 'name 1'
    }]
  }

  return (<Test params={params} />)// fromPug(Pug, { params })
}

export default Home
