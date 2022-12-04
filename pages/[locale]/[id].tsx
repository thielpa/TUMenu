import { useState } from 'react'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'
import Banner from '../../components/Banner'
import LayoutContainer from '../../components/Layout/LayoutContainer'
import { getI18nPaths, getI18nProps } from '../../lib/getStatic'
import { FoodPlace } from '../../types/FoodPlace'
import getPathIds from '../../lib/getPathIds'
import { Context } from '../../types/Context'
import getFoodPlaces from '../../lib/getFoodPlaces'
import getFoodPlace from '../../lib/getFoodPlace'
import { FoodPlaceMenu } from '../../types/FoodPlaceMenu'
import getLabels from '../../lib/getLabels'
import { Labels } from '../../types/Labels'
import getQueueStatus from '../../lib/getQueueStatus'
import { Queue } from '../../types/Queue'

// important for the ResizeObserver api
const DynamicSidebar = dynamic(() => import('../../components/Sidebar/Sidebar'), {
  ssr: false,
})

interface CanteenPageProps {
  foodPlaces: FoodPlace[]
  foodPlaceMenu: FoodPlaceMenu
  labels: Labels[]
  queueData: Queue
}

export default function CanteenPage({
  foodPlaces,
  foodPlaceMenu,
  labels,
  queueData,
}: CanteenPageProps) {
  const [height, setHeight] = useState(0)
  const foodPlaceData = foodPlaces.find(
    (foodPlace) => foodPlace.canteen_id === foodPlaceMenu.canteen_id,
  )

  return (
    <>
      <Banner />
      <DynamicSidebar foodPlaces={foodPlaces} height={height} setHeight={setHeight} />
      {foodPlaceData && (
        <LayoutContainer
          foodPlaceMenu={foodPlaceMenu}
          foodPlaceData={foodPlaceData}
          labels={labels}
          height={height}
          queueData={queueData}
        />
      )}
    </>
  )
}

export const getStaticProps = async (ctx: Context) => {
  const { id, locale } = ctx.params
  const foodPlaces = await getFoodPlaces()
  const foodPlaceMenu = await getFoodPlace(locale, id)
  const queueStatusLink = foodPlaces.filter(
    (foodPlace) => foodPlace.canteen_id === 'mensa-garching',
  )[0].queue_status
  let queueData = null
  if (
    queueStatusLink !== null &&
    dayjs().get('hour') < 14 &&
    dayjs().get('hour') >= 11 &&
    dayjs().get('day') !== 6 &&
    dayjs().get('day') !== 0
  ) {
    queueData = await getQueueStatus(queueStatusLink)
  }
  const labels = await getLabels()
  return {
    props: {
      ...(await getI18nProps(ctx, ['common'])),
      foodPlaces,
      foodPlaceMenu,
      labels,
      queueData,
    },
  }
}

export const getStaticPaths = async () => {
  const canteenIds = await getPathIds()
  const i18Paths = getI18nPaths()
  const paths: { params: { locale: string; id: string } }[] = []
  i18Paths.forEach((locale) =>
    canteenIds.forEach((canteen) =>
      paths.push({ params: { locale: locale.params.locale, id: canteen.id } }),
    ),
  )
  return {
    fallback: false,
    paths,
  }
}
