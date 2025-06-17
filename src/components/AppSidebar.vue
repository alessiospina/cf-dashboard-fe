<script setup>
import { RouterLink } from 'vue-router'

// Importazione del nuovo logo CF Dark Mode 3 ottimizzato per sidebar scura
import cfLogoDM3 from '@/assets/brand/cf-logo-dm-3.png'
import { AppSidebarNav } from '@/components/AppSidebarNav.js'
import { useSidebarStore } from '@/stores/sidebar.js'

const sidebar = useSidebarStore()
</script>

<template>
  <CSidebar
    class="border-end"
    colorScheme="dark"
    position="fixed"
    :unfoldable="sidebar.unfoldable"
    :visible="sidebar.visible"
    @visible-change="(value) => sidebar.toggleVisible(value)"
  >
    <CSidebarHeader class="border-bottom">
      <RouterLink custom to="/" v-slot="{ href, navigate }">
        <CSidebarBrand v-bind="$attrs" as="a" :href="href" @click="navigate" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
          <!-- Logo CF Dark Mode 3 per sidebar aperta - versione ottimizzata e centrata -->
          <img
            :src="cfLogoDM3"
            alt="CF Dashboard Logo"
            class="sidebar-brand-full"
            style="height: 40px; width: auto; object-fit: contain; max-width: 90%;"
          />

          <!-- Logo CF Dark Mode 3 compatto per sidebar chiusa - versione centrata -->
          <img
            :src="cfLogoDM3"
            alt="CF"
            class="sidebar-brand-narrow"
            style="height: 40px; width: auto; object-fit: contain; max-width: 90%;"
          />
        </CSidebarBrand>
      </RouterLink>
      <CCloseButton class="d-lg-none" dark @click="sidebar.toggleVisible()" />
    </CSidebarHeader>
    <AppSidebarNav />
    <CSidebarFooter class="border-top d-none d-lg-flex">
      <CSidebarToggler @click="sidebar.toggleUnfoldable()" />
    </CSidebarFooter>
  </CSidebar>
</template>
