<template>
  <nav class="menu-bar">
    <div 
      v-for="menu in menus" 
      :key="menu.id" 
      class="menu-item"
      @mouseenter="showSubMenu(menu.id)"
      @mouseleave="hideSubMenu(menu.id)"
    >
      <button 
        @click="$emit('select', menu)" 
        :class="{active: menu.id === activeId}"
      >
        {{ menu.name }}
      </button>
      
      <!-- 二级菜单 -->
      <div 
        v-if="menu.subMenus && menu.subMenus.length > 0" 
        class="sub-menu"
        :class="{ 'show': hoveredMenuId === menu.id }"
      >
        <button 
          v-for="subMenu in menu.subMenus" 
          :key="subMenu.id"
          @click="$emit('select', subMenu, menu)"
          :class="{active: subMenu.id === activeSubMenuId}"
          class="sub-menu-item"
        >
          {{ subMenu.name }}
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ 
  menus: Array, 
  activeId: Number,
  activeSubMenuId: Number 
});

const hoveredMenuId = ref(null);

function showSubMenu(menuId) {
  hoveredMenuId.value = menuId;
}

function hideSubMenu(menuId) {
  // 延迟隐藏，给用户时间移动到子菜单
  setTimeout(() => {
    if (hoveredMenuId.value === menuId) {
      hoveredMenuId.value = null;
    }
  }, 100);
}
</script>

<style scoped>
.menu-bar {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0 1rem;
  position: relative;
}

.menu-item {
  position: relative;
}

.menu-bar button {
  background: rgba(139, 100, 80, 0.15);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  padding: 0.8rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.menu-bar button::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: #399dff;
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.menu-bar button:hover {
  background: rgba(139, 100, 80, 0.3);
  color: #399dff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.menu-bar button.active {
  background: rgba(57, 157, 255, 0.25);
  color: #399dff;
  border-color: rgba(57, 157, 255, 0.3);
}

.menu-bar button.active::before {
  width: 60%;
}

/* 二级菜单样式 */
.sub-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(40, 30, 25, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  min-width: 120px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 1000;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 4px;
  padding: 4px 0;
}

.sub-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.sub-menu-item {
  display: block !important;
  width: 100% !important;
  text-align: center !important;
  padding: 0.5rem 1rem !important;
  border: none !important;
  background: transparent !important;
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  border-radius: 4px !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
  line-height: 1.5 !important;
  margin: 0 4px !important;
}

.sub-menu-item:hover {
  background: rgba(57, 157, 255, 0.3) !important;
  color: #399dff !important;
  transform: none !important;
}

.sub-menu-item.active {
  background: rgba(57, 157, 255, 0.4) !important;
  color: #399dff !important;
  font-weight: 500 !important;
}

.sub-menu-item::before {
  display: none;
}

@media (max-width: 768px) {
  .menu-bar {
    gap: 0.2rem;
  }
  
  .menu-bar button {
    font-size: 14px;
    padding: .4rem .8rem;
  }
  
  .sub-menu {
    min-width: 100px;
  }
  
  .sub-menu-item {
    font-size: 12px !important;
    padding: 0.3rem 0.8rem !important;
  }
}
</style>
