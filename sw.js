/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "build/wasm/opencv_js.worker.js",
    "revision": "f95a202fe0e8fa623bb12f96ccdd2178"
  },
  {
    "url": "build/wasm/opencv_scalar.js",
    "revision": "0d450250f1648b3131eefc06e55aab50"
  },
  {
    "url": "build/wasm/opencv_simd_threads.js",
    "revision": "c1557ced39d6590849f39de15cadfa14"
  },
  {
    "url": "build/wasm/opencv_threads.js",
    "revision": "9058cb9de03d54631d5308a732f394be"
  },
  {
    "url": "data/classifiers/haarcascade_eye.xml",
    "revision": "ece2c63a648de8978173df40f9831e00"
  },
  {
    "url": "data/classifiers/haarcascade_frontalface_default.xml",
    "revision": "663f963eabf3df6eb215c50ff06bcc22"
  },
  {
    "url": "data/funnyHatsResources/glasses/0.png",
    "revision": "4488e3f40fc71a184e77d5662422f0ad"
  },
  {
    "url": "data/funnyHatsResources/glasses/1.png",
    "revision": "e663a0b248f6fa2b004573e6eec530a6"
  },
  {
    "url": "data/funnyHatsResources/glasses/10.png",
    "revision": "bb39f9233e61acf21fcb7752a5605aeb"
  },
  {
    "url": "data/funnyHatsResources/glasses/11.png",
    "revision": "8afe7b5b67451c853a60cac2574c591f"
  },
  {
    "url": "data/funnyHatsResources/glasses/2.png",
    "revision": "911f8c351103e2db77174c9219bd910a"
  },
  {
    "url": "data/funnyHatsResources/glasses/3.png",
    "revision": "585cbfa0bc573d15dcc2ad1f30ed16d5"
  },
  {
    "url": "data/funnyHatsResources/glasses/4.png",
    "revision": "e41a9583f86f141f2f6ad98be0080577"
  },
  {
    "url": "data/funnyHatsResources/glasses/5.png",
    "revision": "39ea3db3e476bca9f8cb054e6a5ab513"
  },
  {
    "url": "data/funnyHatsResources/glasses/6.png",
    "revision": "c05e3dc0d703b60eceea7cad872bd0d1"
  },
  {
    "url": "data/funnyHatsResources/glasses/7.png",
    "revision": "2c8e84f39a32057de43cc2a2791d6658"
  },
  {
    "url": "data/funnyHatsResources/glasses/8.png",
    "revision": "7bea84f9dbafb4d7ee26019d6cb5a81d"
  },
  {
    "url": "data/funnyHatsResources/glasses/9.png",
    "revision": "3ee0518cc1d43dab88f2de80ff9fb9f8"
  },
  {
    "url": "data/funnyHatsResources/hats/0.png",
    "revision": "9176ac5d455027a6c3f9937da7db054e"
  },
  {
    "url": "data/funnyHatsResources/hats/1.png",
    "revision": "e749c42d9daa8a085e18b3d0069e6c0d"
  },
  {
    "url": "data/funnyHatsResources/hats/10.png",
    "revision": "00118e88c31a5b2ae29ca7fa4e28673e"
  },
  {
    "url": "data/funnyHatsResources/hats/11.png",
    "revision": "b751d6e7e640b93bf566d1593a87d2df"
  },
  {
    "url": "data/funnyHatsResources/hats/12.png",
    "revision": "972811dbb3058a1ed59c467e4fcb27cd"
  },
  {
    "url": "data/funnyHatsResources/hats/13.png",
    "revision": "2aa433348f1fd6e0b2989a50b3cc35e6"
  },
  {
    "url": "data/funnyHatsResources/hats/14.png",
    "revision": "3bd5eeba309a5833685912dcffdab595"
  },
  {
    "url": "data/funnyHatsResources/hats/15.png",
    "revision": "d49238abc8b1a79285a24bb929dd136a"
  },
  {
    "url": "data/funnyHatsResources/hats/16.png",
    "revision": "d02e8b21b3822006f9566fd53017e3fc"
  },
  {
    "url": "data/funnyHatsResources/hats/17.png",
    "revision": "1ff6a6030ce67337f8b39dfbf697e9d2"
  },
  {
    "url": "data/funnyHatsResources/hats/18.png",
    "revision": "f8f6a113658b15b51fb27bac275d4fa2"
  },
  {
    "url": "data/funnyHatsResources/hats/19.png",
    "revision": "ed7bac73ff98cc34b817a9efd73125a8"
  },
  {
    "url": "data/funnyHatsResources/hats/2.png",
    "revision": "0a9425dddacf60f8caef79416099c900"
  },
  {
    "url": "data/funnyHatsResources/hats/20.png",
    "revision": "13bb289361cede296b9e8fdb5ab439c0"
  },
  {
    "url": "data/funnyHatsResources/hats/3.png",
    "revision": "bbbd290c8279ccb1c4e29ee4467c2828"
  },
  {
    "url": "data/funnyHatsResources/hats/4.png",
    "revision": "b3a75f3bb23df812c880689e12a722ea"
  },
  {
    "url": "data/funnyHatsResources/hats/5.png",
    "revision": "667627b9dd1af3b6b22e0bed23ce9143"
  },
  {
    "url": "data/funnyHatsResources/hats/6.png",
    "revision": "e47f0137a02cfb0e6534f7bcd8bb8000"
  },
  {
    "url": "data/funnyHatsResources/hats/7.png",
    "revision": "56f3f391f6f6ee75c6a80987d3317839"
  },
  {
    "url": "data/funnyHatsResources/hats/8.png",
    "revision": "10bec3051452e1d73c73347542886c5d"
  },
  {
    "url": "data/funnyHatsResources/hats/9.png",
    "revision": "c653beff9c0c00330463f6a677b23651"
  },
  {
    "url": "data/google_icons_font.woff2",
    "revision": "0509ab09c1b0d2200a4135803c91d6ce"
  },
  {
    "url": "data/photo_camera_192.png",
    "revision": "89c3e03b3ad202c36c4f601ad987f97a"
  },
  {
    "url": "libs/adapter-latest.js",
    "revision": "4153182069a4df2b3d9be6c02de9fdc8"
  },
  {
    "url": "libs/dat.gui.min.js",
    "revision": "a4a57da65af836dbfe3b319ea4017984"
  },
  {
    "url": "libs/stats.min.js",
    "revision": "929122621ee5a424a212bfdb62288c7d"
  },
  {
    "url": "samples/camera/index.html",
    "revision": "d25636e20299a4658f7cf0981d5b3c33"
  },
  {
    "url": "samples/camera/js/index.js",
    "revision": "ae69fa57cebbc8786294c8c59775282d"
  },
  {
    "url": "samples/camera/js/ui.js",
    "revision": "4ec635f238949ed4778c1b1a2eb0828e"
  },
  {
    "url": "samples/css/base.css",
    "revision": "24686ee05ce888543ccb13194b83fb39"
  },
  {
    "url": "samples/css/camera-bar.css",
    "revision": "52680ca8e4993b41051efa7745480eb8"
  },
  {
    "url": "samples/css/doxygen.css",
    "revision": "97b2ca6896fb7607e51df1f10d49ed41"
  },
  {
    "url": "samples/css/google-icons.css",
    "revision": "42c7e2d1288f3ae8b124e509e830cfd5"
  },
  {
    "url": "samples/css/menu.css",
    "revision": "b21bdc465df0b9e5bbce4abd0ad67b12"
  },
  {
    "url": "samples/css/settings.css",
    "revision": "ea1a979157604659a8042905db6f138a"
  },
  {
    "url": "samples/css/style.css",
    "revision": "3d2168dc810bb2435b0ece19389ac1f8"
  },
  {
    "url": "samples/faceDetectionCaffeScalar/index.html",
    "revision": "39c97232e80427ea06428b2d88044473"
  },
  {
    "url": "samples/faceDetectionCaffeScalar/index.js",
    "revision": "22c61eec12feb088f399e1f464c27452"
  },
  {
    "url": "samples/faceDetectionCaffeSIMDthreads/index.html",
    "revision": "5d82babb6769cad33de0b62133522766"
  },
  {
    "url": "samples/faceDetectionCaffeSIMDthreads/index.js",
    "revision": "eb1aab1c49d7b1289a98e660157e74e7"
  },
  {
    "url": "samples/faceDetectionCaffeThreadsOnly/index.html",
    "revision": "5d82babb6769cad33de0b62133522766"
  },
  {
    "url": "samples/faceDetectionCaffeThreadsOnly/index.js",
    "revision": "1b9282131650ca710364813effc5f607"
  },
  {
    "url": "samples/faceDetectionScalar/index.html",
    "revision": "84c322b046ef73c5ffe1103b3fe51603"
  },
  {
    "url": "samples/faceDetectionScalar/index.js",
    "revision": "bd247532c8c614dece53e06f25f983df"
  },
  {
    "url": "samples/faceDetectionThreadsOnly/index.html",
    "revision": "1fca93e0bd49a95bb7980f536b490cd5"
  },
  {
    "url": "samples/faceDetectionThreadsOnly/index.js",
    "revision": "e0fa9301e34b49984d6d0e335f96b049"
  },
  {
    "url": "samples/filtersScalar/index.html",
    "revision": "e6fd3187903cc5cd1a8df61ec177d325"
  },
  {
    "url": "samples/filtersScalar/js/filters.js",
    "revision": "8d4868bd2ff0e69231f54c4b02e89f6c"
  },
  {
    "url": "samples/filtersScalar/js/index.js",
    "revision": "bef578d64bdf78b744580ce68961cacf"
  },
  {
    "url": "samples/filtersScalar/js/ui.js",
    "revision": "748df26eb64ad421a4aa0aafa64ad7e3"
  },
  {
    "url": "samples/filtersSIMDthreads/index.html",
    "revision": "68e3bc39a29ce3716a3d6135fdb58f9f"
  },
  {
    "url": "samples/filtersSIMDthreads/js/filters.js",
    "revision": "8d4868bd2ff0e69231f54c4b02e89f6c"
  },
  {
    "url": "samples/filtersSIMDthreads/js/index.js",
    "revision": "fc63b9b775b12cfc1badfff31bc4f875"
  },
  {
    "url": "samples/filtersSIMDthreads/js/ui.js",
    "revision": "4c12b670cb631029be6252c8cf6b793f"
  },
  {
    "url": "samples/filtersThreadsOnly/index.html",
    "revision": "68e3bc39a29ce3716a3d6135fdb58f9f"
  },
  {
    "url": "samples/filtersThreadsOnly/js/filters.js",
    "revision": "8d4868bd2ff0e69231f54c4b02e89f6c"
  },
  {
    "url": "samples/filtersThreadsOnly/js/index.js",
    "revision": "9b3121cb4abae79035243e3e756522d5"
  },
  {
    "url": "samples/filtersThreadsOnly/js/ui.js",
    "revision": "4c12b670cb631029be6252c8cf6b793f"
  },
  {
    "url": "samples/funnyHatsScalar/css/tabs.css",
    "revision": "0a5518f764e366770a1f1b848cb97957"
  },
  {
    "url": "samples/funnyHatsScalar/index.html",
    "revision": "b7d605e4a37505a5cbef927ea822f10d"
  },
  {
    "url": "samples/funnyHatsScalar/js/hatsAndGlassesProcessing.js",
    "revision": "4ea01496366956be2499e17534dda220"
  },
  {
    "url": "samples/funnyHatsScalar/js/index.js",
    "revision": "85646272186c9513d79f5edb9646780a"
  },
  {
    "url": "samples/funnyHatsScalar/js/ui.js",
    "revision": "3575334a059f225108509c2c1fed139a"
  },
  {
    "url": "samples/funnyHatsThreadsOnly/css/tabs.css",
    "revision": "0a5518f764e366770a1f1b848cb97957"
  },
  {
    "url": "samples/funnyHatsThreadsOnly/index.html",
    "revision": "00fdfb335701815b90f992ec2ce4b8d2"
  },
  {
    "url": "samples/funnyHatsThreadsOnly/js/hatsAndGlassesProcessing.js",
    "revision": "4ea01496366956be2499e17534dda220"
  },
  {
    "url": "samples/funnyHatsThreadsOnly/js/index.js",
    "revision": "633820b0885a9f1c5a5a0c17b88be01b"
  },
  {
    "url": "samples/funnyHatsThreadsOnly/js/ui.js",
    "revision": "1150ef870a5dd4b59306c5e95909d3f4"
  },
  {
    "url": "samples/index.html",
    "revision": "522e7d05a20cdb2c2c5a5207679fab5a"
  },
  {
    "url": "utils/menu.js",
    "revision": "9299056aa4e04020f3a366923cf58cb4"
  },
  {
    "url": "utils/statsInit.js",
    "revision": "e5e0e96d88631259ad9fb63d5b40bed8"
  },
  {
    "url": "utils/utils.js",
    "revision": "fe30e62f3d68635148f15cb0a0b615bd"
  },
  {
    "url": "workbox-config.js",
    "revision": "3264bc8fe7f96396d9e067d5bde4eed6"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
