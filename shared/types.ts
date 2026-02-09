export const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/aaajiao/aaajiao_scraper/main/aaajiao_works.json'

export interface Work {
  url: string
  title: string
  title_cn: string
  year: string
  type: string
  materials: string
  size: string
  duration: string
  credits: string
  description_en: string
  description_cn: string
  images: string[]
  high_res_images: string[]
  source: string
  video_link: string
}
