import Image from 'next/image'

export type HomepageSectionOrnamentTone = 'about' | 'now' | 'inspiration'

const SECTION_ORNAMENTS: Record<
  HomepageSectionOrnamentTone,
  {
    height: number
    src: string
    width: number
  }
> = {
  about: {
    src: '/assets/homepage/section-about-companion.png',
    width: 1320,
    height: 719,
  },
  now: {
    src: '/assets/homepage/section-now-companion.png',
    width: 1320,
    height: 742,
  },
  inspiration: {
    src: '/assets/homepage/section-inspiration-companion.png',
    width: 1320,
    height: 743,
  },
}

interface HomepageSectionOrnamentProps {
  tone: HomepageSectionOrnamentTone
}

export function HomepageSectionOrnament({ tone }: HomepageSectionOrnamentProps) {
  const ornament = SECTION_ORNAMENTS[tone]

  return (
    <div className={`section-ornament section-ornament-${tone}`} aria-hidden="true">
      <div className="section-ornament-media">
        <Image
          src={ornament.src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          fill
          sizes="(max-width: 720px) 0px, (max-width: 1080px) 68vw, 640px"
          className="section-ornament-img"
        />
      </div>
    </div>
  )
}
