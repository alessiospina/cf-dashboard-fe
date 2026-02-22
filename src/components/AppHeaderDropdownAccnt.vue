<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/authStore'
import avatar from '@/assets/images/avatars/8.jpg'

const router    = useRouter()
const authStore = useAuthStore()

const username = computed(() => authStore.currentUser?.username ?? 'Utente')
const userRole = computed(() => authStore.currentUser?.role ?? '')

async function handleLogout() {
  await authStore.logout()
  await router.push({ name: 'Login' })
}
</script>

<template>
  <CDropdown placement="bottom-end" variant="nav-item">
    <CDropdownToggle class="py-0 pe-0" :caret="false">
      <CAvatar :src="avatar" size="md" />
    </CDropdownToggle>

    <CDropdownMenu class="pt-0" style="min-width: 200px;">

      <!-- Intestazione account -->
      <CDropdownHeader
        component="h6"
        class="bg-body-secondary text-body-secondary fw-semibold mb-2 rounded-top"
      >
        Account
      </CDropdownHeader>

      <!-- Nome utente + ruolo -->
      <div class="px-3 py-2 mb-1">
        <div class="fw-semibold text-body" style="font-size: 0.9rem;">
          <CIcon icon="cil-user" class="me-1" />
          {{ username }}
        </div>
        <div
          v-if="userRole"
          class="text-body-secondary mt-1"
          style="font-size: 0.75rem; letter-spacing: 0.05em;"
        >
          {{ userRole }}
        </div>
      </div>

      <CDropdownDivider />

      <!-- Logout -->
      <CDropdownItem
        class="text-danger"
        style="cursor: pointer;"
        @click="handleLogout"
      >
        <CIcon icon="cil-account-logout" class="me-2" />
        Esci
      </CDropdownItem>

    </CDropdownMenu>
  </CDropdown>
</template>
