/**
 * Configuration de la navigation - Menu de la sidebar
 * 
 * Ce fichier contient la configuration complète du menu de navigation
 * pour Proxy Market Dashboard. Facilite la maintenance et les modifications futures.
 */

import {
  BoxIcon,
  GridIcon,
  ListIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import type { NavItem } from "../types";

/**
 * Items de navigation principaux
 * TODO: Adapter ces items selon les besoins spécifiques de Proxy Market
 */
export const mainNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [
      { name: "Tableau de bord", path: "/" },
      { name: "Statistique", path: "/statistics" },
    ],
  },
  // TODO: Réactiver quand nécessaire
  // {
  //   icon: <CalenderIcon />,
  //   name: "Calendrier",
  //   path: "/calendar",
  // },
  {
    icon: <UserCircleIcon />,
    name: "Profil",
    path: "/profile",
  },
  {
    name: "Administration",
    icon: <ListIcon />,
    subItems: [
      // Masqué - Composants de formulaire non utilisé en production
      // { name: "Composants de formulaire", path: "/form-elements" },
      { name: "Créer une boutique", path: "/add-franchise" },
      { name: "Créer un administrateur", path: "/add-admin" },
      { name: "Publier un produit", path: "/add-product" },
      { name: "Créer une bannière", path: "/add-banner" },
    ],
  },
  {
    name: "Gestion des rôles",
    icon: <TableIcon />,
    subItems: [
      { name: "Voir toutes les boutiques", path: "/basic-tables" },
      { name: "Voir tous les franchisés", path: "/boutique-users-table" },
      { name: "Voir tous les clients", path: "/users-table" },
      { name: "Voir tous les livreurs", path: "/livreurs-table" },
      { name: "Voir tous les administrateurs", path: "/admins-table" },
    ],
  },
  {
    name: "Gestion des produits",
    icon: <BoxIcon />,
    subItems: [
      { name: "Voir tous les produits", path: "/products-table" },
      { name: "Voir toutes les commandes", path: "/orders" },
      { name: "Voir toutes les ventes", path: "/sales-table" },
      { name: "Voir toutes les bannières", path: "/banners" },
    ],
  },
  // Masqué - Gardé pour référence (page 404 utilisée)
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Page vierge", path: "/blank" },
  //     { name: "404 Erreur", path: "/error-404" },
  //   ],
  // },
];

/**
 * Items de navigation secondaires
 * TODO: Adapter ces items selon les besoins spécifiques de Proxy Market
 */
export const secondaryNavItems: NavItem[] = [
  // Masqué - Non utilisé dans la production
  // {
  //   icon: <PieChartIcon />,
  //   name: "Graphiques",
  //   subItems: [
  //     { name: "Graphique linéaire", path: "/line-chart" },
  //     { name: "Graphique en barres", path: "/bar-chart" },
  //   ],
  // },
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "Éléments UI",
  //   subItems: [
  //     { name: "Alertes", path: "/alerts" },
  //     { name: "Avatar", path: "/avatars" },
  //     { name: "Badge", path: "/badge" },
  //     { name: "Boutons", path: "/buttons" },
  //     { name: "Images", path: "/images" },
  //     { name: "Vidéos", path: "/videos" },
  //   ],
  // },
  // {
  //   icon: <PlugInIcon />,
  //   name: "Authentification",
  //   subItems: [
  //     { name: "Connexion", path: "/signin" },
  //     { name: "Inscription", path: "/signup" },
  //   ],
  // },
];
