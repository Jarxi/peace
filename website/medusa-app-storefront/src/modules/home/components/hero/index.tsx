import { Button, Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

const Hero = () => {
  return (
    <div className="relative w-full h-[600px] lg:h-[700px] bg-neutral-900">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        {/* Left Side - Text Content */}
        <div className="flex flex-col justify-center items-start px-8 md:px-16 lg:px-24 py-12 lg:py-0 text-white z-10 bg-gradient-to-r from-black/80 to-transparent lg:bg-none">
          <div className="max-w-xl">
            <Heading
              level="h1"
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            >
              Built for Adventure
            </Heading>
            <p className="text-lg md:text-xl mb-8 text-gray-200 leading-relaxed">
              Premium craftsmanship, rugged durability & timeless style, inspired by those who work hard and play harder.
            </p>
            <LocalizedClientLink href="/store">
              <Button
                size="large"
                className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-4 text-base"
              >
                Shop Collection
              </Button>
            </LocalizedClientLink>
          </div>
        </div>

        {/* Right Side - Product Image */}
        <div className="relative h-full hidden lg:block">
          <Image
            src="https://rockroosterfootwear.com/cdn/shop/files/rockrooster2-24_1_508x886_crop_center.jpg?v=1684221450"
            alt="Rockrooster Adventure Boots"
            fill
            className="object-contain object-center"
            priority
            sizes="50vw"
            quality={95}
          />
          {/* Gradient overlay for better image blending */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/10 to-black/50" />
        </div>

        {/* Mobile Background Image */}
        <div className="absolute inset-0 lg:hidden">
          <Image
            src="https://rockroosterfootwear.com/cdn/shop/files/rockrooster2-24_1_508x886_crop_center.jpg?v=1684221450"
            alt="Rockrooster Boots"
            fill
            className="object-cover object-center opacity-40"
            priority
            sizes="100vw"
            quality={95}
          />
        </div>
      </div>
    </div>
  )
}

export default Hero
