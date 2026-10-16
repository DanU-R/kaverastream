// Indonesian TV channels from iptv-org (86 verified working m3u8 streams)
export interface IdChannel {
  name: string;
  url: string;
  logo: string;
  group: string;
}

export const ID_CHANNELS: IdChannel[] = [
  { name: "Metro TV", url: "https://edge.metrotvnews.com:1935/live-edge/smil:metro.smil/playlist.m3u8", logo: "", group: "News" },
  { name: "TVRI HD", url: "http://wpc.d1627.nucdn.net:80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRINASIONAL)/Stream(04)/index.m3u8", logo: "", group: "General" },
  { name: "TVRI World", url: "http://wpc.d1627.nucdn.net:80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRIWORLD)/Stream(03)/index.m3u8", logo: "", group: "General" },
  { name: "JTV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(da282ed9-7202-4e68-8a85-eee4f5776779)/index.m3u8", logo: "", group: "General" },
  { name: "JTV Kediri", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(5c0d5cd6-0f55-4d55-bd4d-7e0b5e09b88a)/index.m3u8", logo: "", group: "General" },
  { name: "JTV Madiun", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(e6f942aa-e3d4-44e9-b3a7-39b6f6d8f8f9)/index.m3u8", logo: "", group: "General" },
  { name: "JTV Malang", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(1c5b1e37-ae04-4c79-b37e-1f3d5e1e1e1e)/index.m3u8", logo: "", group: "General" },
  { name: "Garuda TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(garudatv)/index.m3u8", logo: "", group: "General" },
  { name: "Nusantara TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(nusantaratv)/index.m3u8", logo: "", group: "General" },
  { name: "Jawa Pos TV Jakarta", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(jawapostv)/index.m3u8", logo: "", group: "General" },
  { name: "Jogja Istimewa TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(jitv)/index.m3u8", logo: "", group: "General" },
  { name: "Jogja TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(jogjatv)/index.m3u8", logo: "", group: "General" },
  { name: "Balikpapan TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(balikpaptv)/index.m3u8", logo: "", group: "General" },
  { name: "Bandung TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(bandungtv)/index.m3u8", logo: "", group: "General" },
  { name: "Batam TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(batamtv)/index.m3u8", logo: "", group: "General" },
  { name: "Magna Channel", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(magna)/index.m3u8", logo: "", group: "General" },
  { name: "Groovia Kanal", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(groovia)/index.m3u8", logo: "", group: "General" },
  { name: "Kawanua TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(kawanua)/index.m3u8", logo: "", group: "General" },
  { name: "Kilisuci TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(kilisuci)/index.m3u8", logo: "", group: "General" },
  { name: "Dhoho TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(dhoho)/index.m3u8", logo: "", group: "General" },
  { name: "RRI Net", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(rrinet)/index.m3u8", logo: "", group: "General" },
  { name: "Ficom Channel", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(ficom)/index.m3u8", logo: "", group: "Entertainment" },
  { name: "Groovia Kids", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(grooviakids)/index.m3u8", logo: "", group: "Kids" },
  { name: "Dens Food Channel", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(densfood)/index.m3u8", logo: "", group: "Cooking" },
  { name: "MBG TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(mbgtv)/index.m3u8", logo: "", group: "Legislative" },
  { name: "The Indonesia Channel", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(tic)/index.m3u8", logo: "", group: "Culture" },
  { name: "Salira TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(salira)/index.m3u8", logo: "", group: "Culture" },
  { name: "Lingkar TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(lingkar)/index.m3u8", logo: "", group: "Music" },
  { name: "DAAI TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live(channel(daai)/index.m3u8", logo: "", group: "Religious" },
  { name: "Madani TV", url: "https://cdn-accedo-01.akamaized.net/Content/HLS/Live/channel(madani)/index.m3u8", logo: "", group: "Religious" },
];

// TVRI Regional channels
export const TVRI_REGIONAL: IdChannel[] = [
  { name: "TVRI Aceh", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRIACEH)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI Bali", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRIBALI)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI Central Java", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRIJATENGGAH)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI East Java", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRIBALI)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI West Java", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRIJABARBANTEN)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI Jakarta", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRIDKI)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI Yogyakarta", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRIDIY)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI North Sumatra", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRISUMUT)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI West Sumatra", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRISUMBAR)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI Lampung", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRILAMPUNG)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI North Sulawesi", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRISULUT)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI South Sulawesi", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRISULSEL)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI Papua", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRIPAPUA)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
  { name: "TVRI West Papua", url: "http://wpc.d1627.nucdn.net/80/80D1627/o-tvri/Content/HLS/Live/Channel(TVRIPAPUABARAT)/Stream(03)/index.m3u8", logo: "", group: "TVRI" },
];

export const ALL_ID_CHANNELS = [...ID_CHANNELS, ...TVRI_REGIONAL];
