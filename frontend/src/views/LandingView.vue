<template>
  <div class="min-h-screen bg-white">
    <section class="flex items-center justify-center px-6 pt-20 pb-16 bg-gray-50">
      <div class="max-w-3xl text-center">
        <h1 class="text-5xl md:text-7xl font-extrabold text-gray-900 mb-4">
          FixFinder
        </h1>
        <p class="text-xl md:text-2xl font-medium text-indigo-600 mb-6 tracking-wide">
          Repair, don’t replace — find trusted local fixers for small everyday items.
        </p>
        <p class="text-lg text-gray-600 mb-10 leading-relaxed">
          Broken Zipper? Worn off shoes? Fused out lamp? <br>
          Find local help to repair in a price competitive environment! <br> <br>
          Technician looking for side gigs? <br> Sign up now!
        </p>

        <div class="flex flex-col sm:flex-row justify-center gap-4">
            <router-link 
            to="/signup" 
            class="px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition"
            >
            Get Started for Free
            </router-link>

            <router-link 
            to="/login" 
            class="px-8 py-4 bg-white text-indigo-600 font-bold rounded-lg border border-gray-200 hover:border-indigo-300 transition"
            >
            Log In
            </router-link>
        </div>
      </div>
    </section>

    <section class="py-20 px-6 max-w-6xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        
        <div class="flex flex-col items-start">
          <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 text-2xl">
            ⚡
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Quick Quote System</h3>
          <p class="text-gray-600">Allows nearby verified repairers to submit bids/quotes rapidly</p>
        </div>

        <div class="flex flex-col items-start">
          <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 text-2xl">
            🔒
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Booking System</h3>
          <p class="text-gray-600">Chat and scheduling to arrange drop-off or pickup</p>
        </div>

        <div class="flex flex-col items-start">
          <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 text-2xl">
            🎨
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Service Flexibility</h3>
          <p class="text-gray-600">Option for mobile or at-home repair services</p>
        </div>

      </div>
    </section>
  </div>
</template>

<script setup>
const handleAction = (type) => {
  if (type === 'signup') {
    console.log("Redirecting to Signup...");
  } else {
    console.log("Redirecting to Login...");
  }
};
</script>