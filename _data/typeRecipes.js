/**
 * Surfaces the type recipe metadata into Eleventy data so the gallery
 * can display "(display + body + editorial + code)" alongside the color
 * recipe id under each thumbnail.
 */

module.exports = async function () {
  const { getTypeRecipeSummaries } = await import("@chimichurricode/design-system/recipes");
  return getTypeRecipeSummaries();
};
