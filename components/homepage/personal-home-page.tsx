import { DigitalClock } from './digital-clock'
import { GreetingModule } from './greeting-module'
import { HomepageReusedSection, type HomepageReusedSectionProps } from './homepage-reused-section'
import { SearchBox } from './search-box'
import { WeatherModule } from './weather-module'

interface PersonalHomePageProps {
  reusedSectionProps: HomepageReusedSectionProps
}

export function PersonalHomePage({ reusedSectionProps }: PersonalHomePageProps) {
  return (
    <div className="min-h-screen relative">
      {/* Weather — top left, absolute positioned */}
      <WeatherModule />

      {/* Upper section: clock + search + greeting */}
      <div className="flex flex-col items-center justify-center min-h-[35vh] pt-16 pb-8 px-4">
        <DigitalClock />
        <div className="mt-6 w-full flex justify-center">
          <SearchBox />
        </div>
        <GreetingModule />
      </div>

      {/* Lower section: waken-wa reused modules */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-40">
        <HomepageReusedSection {...reusedSectionProps} />
      </div>
    </div>
  )
}
