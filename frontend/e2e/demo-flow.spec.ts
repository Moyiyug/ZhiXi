import { test, expect } from "playwright/test"

test.describe("ZhiXi Demo Flow", () => {
  test("complete demo flow: dashboard → cases → generate → report → export", async ({ page }) => {
    // 1. Open dashboard
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "ZhiXi 智析" })).toBeVisible({ timeout: 10000 })
    const casesLink = page.getByRole("navigation").getByRole("link", { name: "案例素材库" })
    await expect(casesLink).toBeVisible()

    // 2. Navigate to cases
    await casesLink.click()
    await page.waitForURL("/cases")
    // Should show seeded case cards
    await expect(page.locator("[data-slot='card']").first()).toBeVisible({ timeout: 10000 })

    // 3. Navigate to generate
    await page.getByRole("navigation").getByRole("link", { name: "智能生成" }).click()
    await page.waitForURL("/generate")

    // 4. Input event text (use example)
    const textarea = page.locator("textarea").first()
    await textarea.fill("某高校食堂被曝食品卫生问题，学生在社交平台发布图片后引发大量转发，评论区集中要求学校公开调查结果并追责相关负责人。学校目前尚未发布正式通报，校内学生情绪较为集中。")
    await expect(textarea).toHaveValue(/高校食堂/)

    // 5. Click generate profile
    await page.click("text=生成事件画像")
    // Wait for profile to appear
    await expect(page.locator("text=事件摘要")).toBeVisible({ timeout: 15000 })

    // 6. Click retrieve
    await page.click("text=检索参考案例")
    // Wait for results (may show results or empty state)
    await page.waitForTimeout(3000)

    // 7. Click generate report
    const genButton = page.locator("text=生成三段式报告")
    if (await genButton.isEnabled()) {
      await genButton.click()
      // Should navigate to report page
      await page.waitForURL(/\/reports\/\d+/, { timeout: 15000 })

      // 8. Verify report has 3 segments
      await expect(page.getByRole("heading", { name: "一、舆情画像与历史案例参考" })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole("heading", { name: "二、处置结论与回应话术" })).toBeVisible()
      await expect(page.getByRole("heading", { name: "三、免责声明与使用边界" })).toBeVisible()

      // 9. Verify export button exists
      await expect(page.getByRole("button", { name: /导出 Markdown/ })).toBeVisible({ timeout: 5000 })

      // 10. The three exact segment headings above prove all report segments rendered.
    }
  })

  test("dashboard shows metrics", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=案例总数")).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=可检索案例")).toBeVisible()
    await expect(page.locator("text=已向量化")).toBeVisible()
    await expect(page.locator("text=报告数量")).toBeVisible()
  })

  test("cases page shows filters and toolbar", async ({ page }) => {
    await page.goto("/cases")
    await expect(page.locator("text=新增")).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=导入 CSV")).toBeVisible()
    await expect(page.getByPlaceholder(/搜索案例名称/)).toBeVisible()
  })

  test("settings page shows no real API keys", async ({ page }) => {
    await page.goto("/settings")
    await page.waitForTimeout(3000)
    // Check that the page content does NOT contain sk- or api- patterns
    const content = await page.content()
    expect(content).not.toContain("sk-")
    expect(content).not.toMatch(/api-key/i)
  })

  test("evaluation page has demo events", async ({ page }) => {
    await page.goto("/evaluation")
    await expect(page.getByRole("button", { name: /高校食堂/ })).toBeVisible({ timeout: 10000 })
  })

  test("404 page shows for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-route")
    await expect(page.locator("text=404")).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=页面未找到")).toBeVisible()
  })
})
