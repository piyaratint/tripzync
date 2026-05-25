declare module 'react-simple-maps' {
  import { ReactNode, CSSProperties } from 'react'

  export interface ProjectionConfig {
    center?: [number, number]
    scale?: number
    rotate?: [number, number, number]
  }

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: ProjectionConfig
    width?: number
    height?: number
    style?: CSSProperties
    children?: ReactNode
  }
  export function ComposableMap(props: ComposableMapProps): JSX.Element

  export interface GeographiesProps {
    geography: string | object
    children: (args: { geographies: Geography[] }) => ReactNode
  }
  export function Geographies(props: GeographiesProps): JSX.Element

  export interface Geography {
    rsmKey: string
    id: string | number
    properties: Record<string, unknown>
    [key: string]: unknown
  }

  export interface GeographyProps {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: { default?: CSSProperties; hover?: CSSProperties; pressed?: CSSProperties }
    [key: string]: unknown
  }
  export function Geography(props: GeographyProps): JSX.Element

  export interface MarkerProps {
    coordinates: [number, number]
    children?: ReactNode
    [key: string]: unknown
  }
  export function Marker(props: MarkerProps): JSX.Element

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    onMoveStart?: (position: { coordinates: [number, number]; zoom: number }) => void
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void
    children?: ReactNode
    [key: string]: unknown
  }
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element
}
